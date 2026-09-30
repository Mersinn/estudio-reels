"""Confere cada fala recortada (public/vo/<id>.mp3): transcreve (Parakeet, local) e compara com o roteiro, palavra
por palavra. Aponta palavra faltando (fala cortada) ou sobrando (riso, respiro, repetição, pedaço da fala vizinha).
Rode SEMPRE depois de scripts/vo_nova_voz.py e antes de mixar. Uso: python scripts/conferir_voz.py

Leitura do resultado (lições do reel da prótese, set/2026):
  - "para" × "pra", "1600" × "mil e seiscentos", "5" × "cinco": só grafia do reconhecedor, não é erro;
  - palavra a mais no meio (ex.: "ressonância É a partir"): o ElevenLabs às vezes INVENTA uma palavra; meça o
    trecho (energia a cada 10 ms) e, se a palavra estiver entre duas pausas, corte com transição de 10 ms;
  - na dúvida, rode o reconhecedor numa voz provisória do mesmo texto: se lá não aparece, a palavra é real;
  - o reconhecedor às vezes "ouve" um "A" no começo de uma fala isolada: confira no áudio antes de cortar
    (no reel da prótese era a sílaba "Pró", e cortar teria estragado a palavra).
"""
import difflib, json, os, re, subprocess, unicodedata
import numpy as np
import sherpa_onnx

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
M = os.environ.get("MODELOS", r"C:\modelos" if os.name == "nt" else os.path.expanduser("~/modelos"))
P = os.path.join(M, "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8") + os.sep
asr = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=P + "encoder.int8.onnx", decoder=P + "decoder.int8.onnx", joiner=P + "joiner.int8.onnx",
                                                    tokens=P + "tokens.txt", model_type="nemo_transducer", num_threads=6)
# grafias equivalentes (o reconhecedor escreve números em algarismos e "para" por "pra")
EQUIV = {"para": "pra", "0": "zero", "1": "um", "2": "dois", "3": "tres", "4": "quatro", "5": "cinco", "6": "seis", "7": "sete",
         "8": "oito", "9": "nove", "10": "dez"}
try:
    import sys
    sys.path.insert(0, os.path.join(ROOT, "roteiro"))
    import falas  # noqa: E402
    SEM_VOZ = set(getattr(falas, "SEM_VOZ", ()))
except Exception:
    SEM_VOZ = set()


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))
    return EQUIV.get(w, w)


d = json.load(open(os.path.join(ROOT, "src", "data", "vo.json"), encoding="utf-8"))
ruins = 0
for l in d["lines"]:
    if l["id"] in SEM_VOZ:
        continue
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "public", "vo", l["id"] + ".mp3"), "-ac", "1", "-ar", "16000",
                                      "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    st = asr.create_stream(); st.accept_waveform(16000, x); asr.decode_stream(st)
    ouvido = [norm(w) for w in st.result.text.split() if norm(w)]
    texto = [norm(w["w"]) for w in l["words"] if norm(w["w"])]
    difs = [(t, " ".join(texto[i1:i2]), " ".join(ouvido[j1:j2]))
            for t, i1, i2, j1, j2 in difflib.SequenceMatcher(None, texto, ouvido, autojunk=False).get_opcodes() if t != "equal"]
    reais = [x_ for x_ in difs if not (x_[0] == "replace" and x_[1].replace(" ", "") == x_[2].replace(" ", ""))]
    if reais:
        ruins += 1
        print(f"{l['id']:6s} ⚠ {reais}  | ouvido: {st.result.text}")
    else:
        print(f"{l['id']:6s} ok")
print(f"falas com diferença: {ruins} (confira cada ⚠: grafia de número/'pra' não é erro)")

"""Troca a voz sintética por uma gravação humana.

Uso:  pip install faster-whisper
      python scripts/align_recording.py caminho/da/gravacao.m4a

1. limpa a gravação (ruído de fundo, graves, nível)
2. transcreve com tempo por palavra (faster-whisper, local e gratuito)
3. acha cada fala do roteiro dentro da gravação (a ÚLTIMA tentativa de cada frase vale,
   então pode errar e repetir)
4. recorta cada fala em public/vo/<id>.mp3 e reescreve src/data/vo.json com as mesmas
   pausas desenhadas do roteiro. Depois disso, rode audio_mix.py e renderize.
"""
import difflib, json, os, re, subprocess, sys, unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "roteiro"))
from falas import LINES  # noqa: E402
VO_DIR = os.path.join(ROOT, "public", "vo")
DATA = os.path.join(ROOT, "src", "data", "vo.json")
LEAD_IN = 0.35
TOKEN = re.compile(r"\{([^|}]+)\|([^}]+)\}|(\S+)")


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


def script_tokens(text):
    """[(exibido, [palavras faladas normalizadas])]"""
    out = []
    for m in TOKEN.finditer(text):
        if m.group(1):
            out.append((m.group(1), [norm(x) for x in m.group(2).split()]))
        elif re.search(r"\w", m.group(3)):
            out.append((m.group(3), [norm(m.group(3))]))
        elif out:
            out[-1] = (out[-1][0] + m.group(3), out[-1][1])
    return out


def main(src):
    from faster_whisper import WhisperModel
    clean = os.path.join(ROOT, "out", "voz_limpa.wav")
    os.makedirs(os.path.dirname(clean), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "48000",
                    "-af", "highpass=f=80,afftdn=nf=-25,loudnorm=I=-18:TP=-2", clean], check=True)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(clean, language="pt", word_timestamps=True, vad_filter=True)
    rec = [(norm(w.word), w.start, w.end) for s in segs for w in s.words if norm(w.word)]
    rec_words = [r[0] for r in rec]
    t, out = LEAD_IN, []
    for lid, text, pause, scene in LINES:
        toks = script_tokens(text)
        target = [w for _, ws in toks for w in ws]
        # procura a última ocorrência mais parecida com a frase na gravação
        best, best_i = 0.0, None
        for i in range(0, len(rec_words) - len(target) + 1):
            r = difflib.SequenceMatcher(None, target, rec_words[i:i + len(target)]).ratio()
            if r >= best - 1e-9 and r > 0.6:
                best, best_i = r, i
        if best_i is None:
            raise SystemExit(f"não achei a fala '{lid}' na gravação")
        span = rec[best_i:best_i + len(target)]
        s0, s1 = span[0][1], span[-1][2]
        seg = os.path.join(VO_DIR, f"{lid}.mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", clean, "-ss", f"{max(0, s0 - 0.05):.3f}",
                        "-to", f"{s1 + 0.25:.3f}", "-q:a", "2", seg], check=True)
        words, k = [], 0
        for shown, ws in toks:
            a, b = span[k][1], span[min(k + len(ws), len(span)) - 1][2]
            words.append({"w": shown, "s": round(a - s0 + t, 3), "e": round(b - s0 + t, 3)})
            k += len(ws)
        speech = s1 - s0
        out.append({"id": lid, "scene": scene, "start": round(t, 3), "end": round(t + speech, 3),
                    "audioStart": round(t - 0.05, 3), "audioDur": round(speech + 0.3, 3),
                    "text": re.sub(r"\{([^|}]+)\|[^}]+\}", lambda m: m.group(1), text), "words": words})
        print(f"{lid:9s} {t:6.2f}s  fala {speech:4.2f}s  (semelhança {best:.2f})")
        t += speech + pause
    json.dump({"voice": "humana", "total": round(t, 3), "lines": out}, open(DATA, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"TOTAL {t:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1])

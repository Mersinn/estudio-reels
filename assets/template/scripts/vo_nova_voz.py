"""Voz do ElevenLabs (ou qualquer tomada gravada) no RITMO NATURAL: o VÍDEO acompanha a voz (cenas, legendas e
efeitos seguem src/data/vo.json). Nasceu nos reels da sutura e da prótese (LACP-PB, set/2026).

A tomada principal traz todas as falas em ordem (ex.: public/vo_eleven/tomada.mp3). O script reconhece as palavras
(Parakeet, sherpa-onnx, local), alinha com o roteiro (roteiro/falas.py) e corta fala a fala:
  - cada fala termina no PRIMEIRO silêncio real depois da última palavra (riso, respiro ou o começo da fala
    seguinte NÃO entram: foi o erro que gerou "riso + 'não' repetido" no reel da prótese);
  - as margens de respiro nunca invadem a fala vizinha;
  - os silêncios entre as falas são os do roteiro, não os da tomada.
Fala gravada à parte (pedida depois): public/vo_eleven/<id>.mp3 com só aquela fala; entra sozinha.

Opções em roteiro/falas.py (todas opcionais):
  ORDEM_GRAVACAO  ordem das falas NA TOMADA, se ela tiver falas que saíram do vídeo
  FORA_DO_VIDEO   {id: texto} das falas que estão na tomada mas saíram do vídeo (servem só para alinhar)
  INICIO_MANUAL   {id: segundos na tomada} para marcar à mão o começo de uma fala
  SEM_VOZ         ids que ficam só na tela (ex.: o "salva e manda…"): mantêm o tempo, com áudio mudo
  LEAD_IN         silêncio antes da primeira fala
Ambiente: VOZ_ARQ (tomada principal) · VOZ_NOME (vai para vo.json) · TEMPO (1.0 = ritmo da tomada; 1.06 = 6% mais
rápido pelo Rubber Band R3, timbre preservado) · MODELOS (pasta dos modelos; padrão C:\\modelos no Windows) ·
RUBBERBAND (executável).
Depois: python scripts/conferir_voz.py (confere cada fala recortada) → python scripts/audio_mix.py → render.
Modelos: sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8 (github.com/k2-fsa/sherpa-onnx, releases asr-models) e
Rubber Band 4 (breakfastquay.com/rubberband). Ver references/07-voz-e-som.md.
"""
import difflib, importlib.util, json, os, re, shutil, subprocess, unicodedata
import numpy as np
import soundfile as sf
import sherpa_onnx

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_s = importlib.util.spec_from_file_location("falas", os.path.join(ROOT, "roteiro", "falas.py"))
falas = importlib.util.module_from_spec(_s); _s.loader.exec_module(falas)
M = os.environ.get("MODELOS", r"C:\modelos" if os.name == "nt" else os.path.expanduser("~/modelos"))
VO_DIR = os.path.join(ROOT, "public", "vo")
DATA = os.path.join(ROOT, "src", "data", "vo.json")
LEAD_IN = getattr(falas, "LEAD_IN", 0.35)
SEM_VOZ = set(getattr(falas, "SEM_VOZ", ()))
TMP = os.path.join(os.environ.get("TEMP", "/tmp"), "vo_nova_voz")
os.makedirs(TMP, exist_ok=True)
TOKEN = re.compile(r"\{([^|}]+)\|([^}]+)\}|(\S+)")
P = os.path.join(M, "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8") + os.sep
asr = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=P + "encoder.int8.onnx", decoder=P + "decoder.int8.onnx", joiner=P + "joiner.int8.onnx",
                                                    tokens=P + "tokens.txt", model_type="nemo_transducer", num_threads=6)

ARQ = os.environ.get("VOZ_ARQ", "public/vo_eleven/tomada.mp3")
ORDEM = [lid for lid in getattr(falas, "ORDEM_GRAVACAO", [lid for lid, *_ in falas.LINES]) if lid not in SEM_VOZ]
FONTES = {lid: (ARQ, ORDEM) for lid in ORDEM}
for lid, *_ in falas.LINES:  # fala gravada à parte: public/vo_eleven/<id>.mp3
    if lid not in FONTES and lid not in SEM_VOZ:
        FONTES[lid] = (f"public/vo_eleven/{lid}.mp3", [lid])
TEMPO = float(os.environ.get("TEMPO", "1.0"))
_rb_win = os.path.join(M, "rubberband", "rubberband-4.0.0-gpl-executable-windows", "rubberband-r3.exe")
RB = os.environ.get("RUBBERBAND", _rb_win if os.path.exists(_rb_win) else "rubberband")


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


def parse(text):
    tokens = []
    for m in TOKEN.finditer(text):
        if m.group(1):
            tokens.append([m.group(1), m.group(2).split()])
        else:
            w = m.group(3)
            if re.search(r"\w", w):
                tokens.append([w, [w]])
            elif tokens:
                tokens[-1][0] += w
    return tokens


def rms_db(x, sr, h=0.02):
    n = int(h * sr)
    e = np.array([np.sqrt(np.mean(x[i:i + n] ** 2) + 1e-12) for i in range(0, len(x) - n, n)])
    return 20 * np.log10(e), n


def janelas(x16):
    """cortes nos silêncios, com janelas de no máximo 18 s (limite do reconhecedor)"""
    db, n = rms_db(x16, 16000)
    cortes, a = [0], 0
    while len(x16) - a > 18 * 16000:
        i0, i1 = (a + 10 * 16000) // n, (a + 18 * 16000) // n
        k = i0 + int(np.argmin(db[i0:i1]))
        a = k * n + n // 2
        cortes.append(a)
    cortes.append(len(x16))
    return list(zip(cortes[:-1], cortes[1:]))


def reconhece(x16):
    out = []
    for a, b in janelas(x16):
        st = asr.create_stream(); st.accept_waveform(16000, x16[a:b]); asr.decode_stream(st)
        cur = None
        for tok, t in zip(st.result.tokens, st.result.timestamps):
            if tok.startswith(" ") or cur is None:
                if cur: out.append(cur)
                cur = {"w": tok.strip(), "t": float(t) + a / 16000}
            else:
                cur["w"] += tok
        if cur: out.append(cur)
    for i, w in enumerate(out):
        w["e"] = out[i + 1]["t"] if i + 1 < len(out) else len(x16) / 16000
    return out


def fim_da_voz(x, sr, t, e):
    """fim real da última palavra: o PRIMEIRO silêncio de 120 ms depois dela (−38 dB do pico)"""
    a, b = int(t * sr), int(max(e, t + 0.3) * sr)
    db, n = rms_db(x[a:b], sr)
    limiar = 20 * np.log10(np.abs(x).max() + 1e-9) - 38
    voz, sil = 0, 0
    for k, v in enumerate(db):
        if v > limiar:
            voz += 1; sil = 0
        else:
            sil += 1
            if voz >= 5 and sil >= 6:
                return min(e, t + (k - sil + 1) * 0.02 + 0.03)
    on = np.nonzero(db > limiar)[0]
    return min(e, t + (on[-1] + 1) * 0.02 + 0.03) if len(on) else e


def inicio_da_voz(x, sr, t, limite):
    """o reconhecedor às vezes perde a 1ª palavra curta ("É", "O"): volta do início achado até o começo real do som
    (−40 dB do pico, tolerando respiros de até 60 ms), sem passar de `limite`"""
    h = int(0.02 * sr); pico = np.abs(x).max()
    lim = pico * 10 ** (-40 / 20)
    i = int(t * sr); fim = int(max(limite, t - 0.8) * sr); sil = 0; ini = i
    while i - h > fim:
        i -= h
        if np.sqrt(np.mean(x[i:i + h] ** 2)) > lim:
            ini = i; sil = 0
        else:
            sil += 1
            if sil > 3: break
    return ini / sr


def alinhar(arq, ordem, textos):
    """tempos (s, e) de cada token de cada fala, dentro do arquivo"""
    x, sr = sf.read(os.path.join(ROOT, arq), dtype="float32")
    if x.ndim > 1: x = x.mean(1)
    x16 = np.interp(np.arange(0, len(x) * 16000 / sr) * sr / 16000, np.arange(len(x)), x).astype(np.float32)
    rec = reconhece(x16)
    alvo, dono = [], []
    for lid in ordem:
        for k, (_, ws) in enumerate(parse(textos[lid])):
            for w in ws: alvo.append(w); dono.append((lid, k))
    sm = difflib.SequenceMatcher(None, [norm(w) for w in alvo], [norm(w["w"]) for w in rec], autojunk=False)
    print(f"{os.path.basename(arq)}: {sm.ratio():.0%} das palavras batem com o roteiro (números e 'pra/para' contam como diferença)")
    tempo = [None] * len(alvo)
    for i, j, n in sm.get_matching_blocks():
        for k in range(n): tempo[i + k] = [rec[j + k]["t"], rec[j + k]["e"]]
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "replace" and j2 > j1:
            s0, e0 = rec[j1]["t"], rec[j2 - 1]["e"]
            for k in range(i1, i2): tempo[k] = [s0 + (e0 - s0) * (k - i1) / (i2 - i1), s0 + (e0 - s0) * (k - i1 + 1) / (i2 - i1)]
    known = [i for i, t in enumerate(tempo) if t]
    for i in range(len(tempo)):
        if tempo[i] is None:
            pv = max([k for k in known if k < i], default=None); nx = min([k for k in known if k > i], default=None)
            s0 = tempo[pv][1] if pv is not None else 0.05
            e0 = tempo[nx][0] if nx is not None else len(x) / sr
            tempo[i] = [s0, max(s0 + 0.08, e0)]
    out = {}
    fim_anterior = 0.0
    for lid in ordem:
        idx = [k for k, d in enumerate(dono) if d[0] == lid]
        s0 = inicio_da_voz(x, sr, tempo[idx[0]][0], fim_anterior + 0.05)
        s0 = getattr(falas, "INICIO_MANUAL", {}).get(lid, s0)
        tempo[idx[0]][0] = s0
        e0 = fim_da_voz(x, sr, tempo[idx[-1]][0], tempo[idx[-1]][1])
        fim_anterior = e0
        out[lid] = (x, sr, s0, e0, [(dono[k][1], tempo[k]) for k in idx])
    return out


def mudo(lid, dur):
    """fala só na tela: um mp3 mudo do tamanho do espaço dela (o Reel toca vo/<id>.mp3 de toda fala)"""
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", f"{max(0.1, dur):.3f}",
                    "-b:a", "64k", os.path.join(VO_DIR, f"{lid}.mp3")], check=True)


def main():
    textos = {lid: txt for lid, txt, *_ in falas.LINES}
    textos.update(getattr(falas, "FORA_DO_VIDEO", {}))
    bak = os.path.join(ROOT, "public", "vo_anterior")
    if not os.path.exists(bak) and os.path.exists(DATA):
        shutil.copytree(VO_DIR, bak); shutil.copy(DATA, os.path.join(bak, "vo.json"))
    antes = {l["id"]: l for l in json.load(open(os.path.join(bak, "vo.json"), encoding="utf-8"))["lines"]} if os.path.exists(bak) else {}
    cache = {}
    t, out = LEAD_IN, []
    for lid, txt, pausa, cena in falas.LINES:
        if lid in SEM_VOZ:  # só na tela: mantém a duração que tinha (ou 2,5 s), sem áudio
            L = antes.get(lid)
            fala = (L["end"] - L["start"]) if L else 2.5
            ws = [w["w"] for w in L["words"]] if L else [sh for sh, _ in parse(txt)]
            words = [{"w": w, "s": round(t + fala * i / len(ws), 3), "e": round(t + fala * (i + 1) / len(ws), 3)} for i, w in enumerate(ws)]
            mudo(lid, fala)
            out.append({"id": lid, "scene": cena, "start": round(t, 3), "end": round(t + fala, 3), "audioStart": round(t, 3), "audioDur": round(fala, 3),
                        "text": re.sub(r"\{([^|}]+)\|[^}]+\}", lambda m: m.group(1), txt), "words": words})
            print(f"{lid:7s} {t:6.2f}s  fala {fala:5.2f}s  (só na tela)")
            t += fala + pausa
            continue
        fonte = FONTES[lid]
        if fonte[0] not in cache: cache[fonte[0]] = alinhar(fonte[0], fonte[1], textos)
        x, sr, s0, e0, ws = cache[fonte[0]][lid]
        # margens de respiro que nunca invadem a fala vizinha na gravação
        ordem_f = fonte[1]
        k = ordem_f.index(lid)
        ant = cache[fonte[0]][ordem_f[k - 1]][3] if k > 0 else 0.0
        prox = cache[fonte[0]][ordem_f[k + 1]][2] if k + 1 < len(ordem_f) else len(x) / sr
        pre = 0.0 if lid in getattr(falas, "INICIO_MANUAL", {}) else min(0.08, max(0.0, s0 - ant - 0.03))
        pos = min(0.22, max(0.0, prox - e0 - 0.03))
        a0, a1 = max(0, s0 - pre), min(len(x) / sr, e0 + pos)
        y = x[int(a0 * sr):int(a1 * sr)].copy()
        nf = int(0.012 * sr); y[:nf] *= np.linspace(0, 1, nf); y[-int(0.08 * sr):] *= np.linspace(1, 0, int(0.08 * sr))
        fonte_wav = os.path.join(TMP, f"_vo_{lid}.wav")
        sf.write(fonte_wav, y, sr)
        if abs(TEMPO - 1.0) > 1e-3:
            est = os.path.join(TMP, f"_vo_{lid}_t.wav")
            subprocess.run([RB, "-q", "-3", "-T", f"{TEMPO:.4f}", fonte_wav, est], check=True, capture_output=True)
            fonte_wav = est
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", fonte_wav, "-af", "apad=pad_dur=0.25", "-ar", "48000", "-ac", "1",
                        "-b:a", "320k", os.path.join(VO_DIR, f"{lid}.mp3")], check=True)
        words = []
        for k, (shown, _) in enumerate(parse(txt)):
            tt = [tm for kk, tm in ws if kk == k]
            words.append({"w": shown, "s": (tt[0][0] - s0) / TEMPO + t, "e": (min(tt[-1][1], e0) - s0) / TEMPO + t})
        for i in range(len(words) - 1):
            words[i]["e"] = min(words[i]["e"], words[i + 1]["s"]) if words[i + 1]["s"] > words[i]["s"] else words[i]["e"]
        fala = (e0 - s0) / TEMPO
        out.append({"id": lid, "scene": cena, "start": round(t, 3), "end": round(t + fala, 3), "audioStart": round(t - (s0 - a0) / TEMPO, 3),
                    "audioDur": round((a1 - a0) / TEMPO + 0.25, 3), "text": re.sub(r"\{([^|}]+)\|[^}]+\}", lambda m: m.group(1), txt),
                    "words": [{"w": w["w"], "s": round(w["s"], 3), "e": round(w["e"], 3)} for w in words]})
        print(f"{lid:7s} {t:6.2f}s  fala {fala:5.2f}s  ({os.path.basename(fonte[0])})")
        t += fala + pausa
    json.dump({"voice": os.environ.get("VOZ_NOME", "ElevenLabs"), "total": round(t, 3), "lines": out},
              open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"TOTAL {t:.2f}s ({int(t // 60)}:{t % 60:05.2f})")


if __name__ == "__main__":
    main()

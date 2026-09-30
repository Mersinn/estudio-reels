"""Narração grátis (edge-tts, vozes neurais pt-BR) + mapa de tempo por palavra.

Lê roteiro/falas.py e gera:
  public/vo/<id>.mp3     uma fala por arquivo
  src/data/vo.json       início de cada fala no vídeo + cada palavra com tempo (o RELÓGIO do vídeo)

O silêncio que o serviço embute no começo/fim de cada fala é descontado pelo tempo das palavras,
e as pausas entre falas são as que VOCÊ desenhou em falas.py.
Uso: python scripts/tts.py [voz]      (pip install edge-tts)
"""
import asyncio, json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "roteiro"))
import falas  # noqa: E402
import edge_tts  # noqa: E402

VO_DIR = os.path.join(ROOT, "public", "vo")
DATA = os.path.join(ROOT, "src", "data", "vo.json")
VOICE = sys.argv[1] if len(sys.argv) > 1 else falas.VOZ
LEAD_IN = getattr(falas, 'LEAD_IN', 0.35)
TOKEN = re.compile(r"\{([^|}]+)\|([^}]+)\}|(\S+)")


def parse(text):
    """-> (texto falado, [[exibido, n_palavras_faladas]])"""
    spoken, tokens = [], []
    for m in TOKEN.finditer(text):
        if m.group(1):
            spoken.append(m.group(2))
            tokens.append([m.group(1), len(m.group(2).split())])
        else:
            w = m.group(3)
            spoken.append(w)
            if re.search(r"\w", w):
                tokens.append([w, 1])
            elif tokens:
                tokens[-1][0] += w
    return " ".join(spoken), tokens


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out.strip())


# personagens gravados pelo Gemini (scripts/gemini_tts.py): soam "na sala", não no ouvido do espectador
SALA = {
    "prec": "highpass=f=90,lowpass=f=7800,aecho=0.8:0.55:28|52:0.16|0.10,volume=-2.5dB",
    "pac": "highpass=f=110,lowpass=f=5200,aecho=0.8:0.5:24|47:0.20|0.12,volume=-4dB",
    # locutor de arena: sistema de som de ginásio (médios na frente, compressão forte, eco longo do ginásio)
    "loc": "highpass=f=120,lowpass=f=9000,equalizer=f=2500:t=q:w=1.2:g=4,acompressor=threshold=-24dB:ratio=5:attack=5:release=90,aecho=0.8:0.6:90|170|260:0.22|0.14|0.08,loudnorm=I=-16:TP=-2",
}
_whisper = None
RITMO_ALVO = getattr(falas, "RITMO_ALVO", 2.55)  # palavras por segundo da narração
TEMPO_LOC = getattr(falas, "TEMPO_LOC", 1.0)  # locutor de arena: andamento (atempo), timbre preservado


def gemini_line(lid, text):
    """alinha as palavras da fala gerada pelo Gemini (faster-whisper) e grava o mp3 tratado"""
    global _whisper
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from vo_from_wavs import align, expandir
    from align_recording import script_tokens
    from faster_whisper import WhisperModel
    if _whisper is None:
        _whisper = WhisperModel("small", device="cpu", compute_type="int8")
    wav = os.path.join(ROOT, "public", "vo_gem", f"{lid}.wav")
    if not os.path.exists(wav):
        raise SystemExit(f"{lid}: falta {wav}. Rode python scripts/gemini_tts.py")
    toks = script_tokens(text)
    target = [w for _, ws in toks for w in ws]
    segs, _ = _whisper.transcribe(wav, language="pt", word_timestamps=True, initial_prompt=text)
    rec = expandir([w for sg in segs for w in sg.words])
    times, sim = align(target, rec)
    if sim < 0.8:
        print(f"  ! {lid}: semelhança {sim:.2f} com o texto: confira a fala")
    papel = "pac" if lid.startswith("pac") else "prec" if lid.startswith("prec") else "loc" if lid.startswith("loc") else "narr"
    path = os.path.join(VO_DIR, f"{lid}.mp3")
    tempo = 1.0
    if papel == "narr":
        # ritmo único para a voz interna: cada fala é levada (sem mudar o tom) para ~2,55 palavras/s
        fala = max(0.3, times[-1][1] - times[0][0])
        if len(target) >= 4:
            tempo = min(1.25, max(0.9, RITMO_ALVO / (len(target) / fala)))
        filtro = f"highpass=f=80,acompressor=threshold=-20dB:ratio=2:attack=10:release=120,atempo={tempo:.3f},loudnorm=I=-17:TP=-2"
    elif papel == "loc":
        tempo = TEMPO_LOC
        filtro = f"atempo={tempo:.3f}," + SALA[papel]
    else:
        filtro = SALA[papel]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", filtro + ",apad=pad_dur=0.25", "-ar", "48000", "-ac", "1", "-q:a", "2", path], check=True)
    words, k = [], 0
    for shown, ws in toks:
        words.append({"w": shown, "s": round(times[k][0] / tempo, 3), "e": round(times[k + len(ws) - 1][1] / tempo, 3)})
        k += len(ws)
    return path, words


async def synth(lid, text):
    if getattr(falas, "VOZES", {}).get(lid, "").startswith("gemini:"):
        return gemini_line(lid, text)
    said, tokens = parse(text)
    rate = getattr(falas, "RITMO", {}).get(lid, getattr(falas, "RITMO_PADRAO", "+0%"))
    # personagens: falas.VOZES = {"id": "pt-BR-AntonioNeural"} troca a voz só naquela fala
    voz = getattr(falas, "VOZES", {}).get(lid, VOICE)
    comm = edge_tts.Communicate(said, voz, rate=rate, boundary="WordBoundary")
    path = os.path.join(VO_DIR, f"{lid}.mp3")
    bounds = []
    with open(path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                bounds.append((chunk["offset"] / 1e7, (chunk["offset"] + chunk["duration"]) / 1e7))
    n_spoken = sum(n for _, n in tokens)
    if n_spoken != len(bounds):
        print(f"  ! {lid}: {n_spoken} palavras esperadas, {len(bounds)} recebidas -> alinhamento proporcional")
    words, i = [], 0
    for shown, n in tokens:
        if n_spoken == len(bounds):
            s, e = bounds[i][0], bounds[i + n - 1][1]
        else:
            tot = bounds[-1][1] if bounds else 1
            s, e = tot * i / n_spoken, tot * (i + n) / n_spoken
        words.append({"w": shown, "s": round(s, 3), "e": round(e, 3)})
        i += n
    return path, words


async def main():
    os.makedirs(VO_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    t, out = LEAD_IN, []
    for lid, text, pause, scene in falas.LINES:
        path, words = await synth(lid, text)
        d = duration(path)
        lead = words[0]["s"]
        speech = words[-1]["e"] - lead
        out.append({"id": lid, "scene": scene, "start": round(t, 3), "end": round(t + speech, 3),
                    "audioStart": round(t - lead, 3), "audioDur": round(d, 3),
                    "text": re.sub(r"\{([^|}]+)\|[^}]+\}", lambda m: m.group(1), text),
                    "words": [{**w, "s": round(w["s"] - lead + t, 3), "e": round(w["e"] - lead + t, 3)} for w in words]})
        print(f"{lid:10s} {t:6.2f}s  fala {speech:4.2f}s  {text[:60]}")
        t += speech + pause
    json.dump({"voice": VOICE, "total": round(t, 3), "lines": out}, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"TOTAL {t:.2f}s  ({round(t * 30)} quadros a 30 fps)")


asyncio.run(main())

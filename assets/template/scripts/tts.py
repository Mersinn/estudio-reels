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
LEAD_IN = 0.35
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


async def synth(lid, text):
    said, tokens = parse(text)
    rate = getattr(falas, "RITMO", {}).get(lid, getattr(falas, "RITMO_PADRAO", "+0%"))
    comm = edge_tts.Communicate(said, VOICE, rate=rate, boundary="WordBoundary")
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

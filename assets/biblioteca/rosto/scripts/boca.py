"""A boca da médica pela voz de verdade: envelope de energia de cada fala dela (public/vo/med*.mp3), quadro a quadro,
posto no tempo global do vídeo (src/data/vo.json). Saída: src/data/boca.json = lista de 0..1 por quadro (30 fps).
Rode depois de scripts/tts.py (ou de vo_nova_voz.py, quando vier a voz final)."""
import json, os, subprocess
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
vo = json.load(open(os.path.join(ROOT, "src", "data", "vo.json"), encoding="utf-8"))
FPS, SR = 30, 16000
N = int(round(vo["total"] * FPS)) + 1
boca = np.zeros(N)
for l in vo["lines"]:
    if not l["id"].startswith("med"):
        continue
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "public", "vo", f"{l['id']}.mp3"), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = SR // FPS
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    ref = np.percentile(rms[rms > 0.005], 90) if (rms > 0.005).any() else 1
    env = np.clip(rms / ref, 0, 1) ** 0.8
    f0 = int(round(l["audioStart"] * FPS))
    for i, v in enumerate(env):
        if 0 <= f0 + i < N:
            boca[f0 + i] = max(boca[f0 + i], v)
# suaviza (a boca não abre e fecha em 1 quadro) e tira ruído baixo
k = np.array([0.25, 0.5, 0.25])
boca = np.convolve(boca, k, mode="same")
boca[boca < 0.08] = 0
json.dump([round(float(v), 3) for v in boca], open(os.path.join(ROOT, "src", "data", "boca.json"), "w"))
print("boca ok", N, "quadros")

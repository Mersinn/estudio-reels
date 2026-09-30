"""Mixagem: narração tratada + efeitos da partitura (roteiro/trilha.py) + trilha ambiente própria.

Saída em public/audio/:
  mix_sfx.wav     narração + efeitos (versão principal)
  mix_music.wav   narração + efeitos + trilha ambiente (sintetizada aqui: sem licença de terceiros)
  sfx_only.wav    só efeitos (para usar com áudio em alta no app)
Loudness final (−14 LUFS, pico −1 dBTP) é aplicado por scripts/render_final.py na montagem do MP4.
Uso: python scripts/audio_mix.py        (pip install numpy scipy)
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "roteiro"))
import sfx_lib as lib  # noqa: E402
import trilha  # noqa: E402

VO = json.load(open(os.path.join(ROOT, "src", "data", "vo.json"), encoding="utf-8"))
L = {l["id"]: l for l in VO["lines"]}
TOTAL = VO["total"]
SR = lib.SR
N = int(TOTAL * SR) + SR
OUT = os.path.join(ROOT, "public", "audio")
os.makedirs(OUT, exist_ok=True)


def fr(s):
    return round(s * 30)


def word(lid, needle):
    for w in L[lid]["words"]:
        if needle.lower() in w["w"].lower():
            return w["s"]
    raise KeyError(f"{needle} não está em {lid}")


def cut(a, b):
    """mesmo corte de src/engine/timeline.ts: meio do silêncio entre as falas"""
    return ((fr(L[a]["end"]) + fr(L[b]["start"])) / 2) / 30


sfx = np.zeros(N)


def at(sec, x, gain_db=0.0):
    s = int(sec * SR)
    if s >= N:
        return
    e = min(N, s + len(x))
    sfx[s:e] += x[: e - s] * lib.db(gain_db)


if __name__ == "__main__":
    vo = lib.voice_track(VO, N)
    trilha.partitura(at, word, cut, L, TOTAL, lib)
    fx = lib.norm(sfx, lib.db(-7)) if np.abs(sfx).max() > lib.db(-7) else sfx
    venv = lib.lp(np.abs(vo), 6, 1)
    duck = 1 - 0.3 * np.clip(venv / (venv.max() + 1e-9) * 4, 0, 1)  # efeitos baixam sob a voz
    mix = vo + fx * duck
    lib.write(os.path.join(OUT, "mix_sfx.wav"), lib.norm(mix, lib.db(-1.5)))
    lib.write(os.path.join(OUT, "sfx_only.wav"), lib.norm(fx, lib.db(-3)))
    music = lib.reverb(lib.pad_music(TOTAL + 1)[:N], 3.0, 0.35)
    music = np.pad(music, (0, max(0, N - len(music))))[:N]  # arredondamento: mesmo tamanho da voz
    mus = music * lib.db(-22) * (1 - 0.45 * np.clip(venv / (venv.max() + 1e-9) * 4, 0, 1))
    lib.write(os.path.join(OUT, "mix_music.wav"), lib.norm(mix + mus, lib.db(-1.5)))
    print(f"mixagem ok: {TOTAL:.2f}s")

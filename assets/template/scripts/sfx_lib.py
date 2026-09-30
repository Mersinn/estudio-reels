"""Biblioteca de som do estúdio: efeitos sintetizados (nada a licenciar), trilha ambiente própria,
tratamento de voz e utilidades de mixagem. Importada por scripts/audio_mix.py e roteiro/trilha.py.

Efeitos: whoosh, thump (grave/batida), clink (vidro), shimmer (brilho), sizzle (brasa/crepitar),
splash, bubbles, underwater (ambiente subaquático), cloth (tecido), squish (pomada/gel), wipe
(passada), paper (papel caindo), pen (caneta riscando), tape_peel (fita descolando), riser (subida),
lamp (luz acendendo), gamma_hum (varredura), pop (clique de palavra).
Todos com semente fixa: o mesmo som em todo render.
"""
import json, os, subprocess
import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
rng = np.random.default_rng(20260926)  # semente fixa: o mesmo som em todo render


# ── utilidades ────────────────────────────────────────────────────────────
def t(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.1, curve=4.0):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    if nr < n:
        e[-nr:] *= np.exp(-curve * np.linspace(0, 1, nr))
    return e
def expdecay(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "low", fs=SR, output="sos"), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "high", fs=SR, output="sos"), x)
def noise(d): return rng.standard_normal(int(d * SR))
def brown(d):
    x = np.cumsum(rng.standard_normal(int(d * SR)))
    x = hp(x, 20)
    return x / (np.abs(x).max() + 1e-9)
def norm(x, peak=1.0): return x * (peak / (np.abs(x).max() + 1e-9))
def sweep_lp(x, f0, f1):
    """filtro passa-baixa de um polo com corte variando no tempo (whoosh)"""
    fc = np.geomspace(f0, f1, len(x))
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a[i] * acc + (1 - a[i]) * x[i]
        y[i] = acc
    return y
def db(v): return 10 ** (v / 20)


# ── biblioteca de efeitos ─────────────────────────────────────────────────
def whoosh(d=0.6, f0=300, f1=4000, peak=0.5):
    x = sweep_lp(noise(d), f0, f1) - sweep_lp(noise(d), f0 * 0.5, f1 * 0.4) * 0.3
    e = np.sin(np.linspace(0, np.pi, len(x))) ** 1.6
    return norm(x * e, peak)

def thump(f=58, d=0.7, peak=0.8, click=0.15):
    tt = t(d)
    ph = 2 * np.pi * np.cumsum(f * (1 + 1.4 * np.exp(-tt / 0.03))) / SR
    x = np.sin(ph) * expdecay(len(tt), d / 4)
    c = hp(noise(0.012), 2000) * np.linspace(1, 0, int(0.012 * SR)) * click
    x[: len(c)] += c
    return norm(x, peak)

def clink(d=1.2, peak=0.35):
    tt = t(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) * expdecay(len(tt), tau)
            for f, a, tau in [(2210, 1, 0.5), (3470, 0.6, 0.35), (5120, 0.4, 0.22), (7340, 0.2, 0.12)])
    return norm(x * env(len(tt), 0.001, 0.3), peak)

def shimmer(d=1.4, peak=0.25, base=2400):
    tt = t(d)
    x = np.zeros(len(tt))
    for k in range(9):
        f = base * (1 + 0.25 * k) * (1 + 0.004 * rng.standard_normal())
        x += np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * (5 + k) * tt))
    x *= np.sin(np.linspace(0, np.pi, len(tt))) ** 2
    return norm(x, peak)

def sizzle(d=1.0, density=260, peak=0.35):
    n = int(d * SR)
    x = hp(noise(d), 3500) * 0.18
    for _ in range(int(density * d)):
        p = rng.integers(0, n - 300)
        k = rng.uniform(0.2, 1.0)
        L_ = rng.integers(20, 180)
        x[p:p + L_] += hp(rng.standard_normal(L_), 1200) * k * np.exp(-np.arange(L_) / 30)
    return norm(x * env(n, 0.05, 0.3), peak)

def splash(d=1.0, peak=0.6):
    x = bp(noise(d), 250, 3500) * expdecay(int(d * SR), 0.18)
    x += bubbles(d, 18, 0.5)[: len(x)]
    return norm(x * env(len(x), 0.002, 0.4), peak)

def bubbles(d=1.0, count=10, peak=0.3):
    n = int(d * SR)
    x = np.zeros(n)
    for _ in range(count):
        L_ = int(rng.uniform(0.02, 0.06) * SR)
        p = rng.integers(0, max(1, n - L_))
        f0 = rng.uniform(350, 900)
        tt = np.arange(L_) / SR
        ch = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 3 * tt / tt[-1])) / SR) * np.exp(-tt / 0.015)
        x[p:p + L_] += ch * rng.uniform(0.3, 1)
    return norm(x, peak)

def underwater(d, peak=0.3):
    x = lp(brown(d), 380) * 0.9 + lp(noise(d), 900) * 0.05
    lfo = 0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * t(d))
    x = x * lfo + bubbles(d, int(d * 1.6), 0.25)
    return norm(x * env(len(x), 0.4, 0.8), peak)

def cloth(d=0.9, peak=0.45):
    x = sweep_lp(noise(d), 1800, 500)
    x *= (0.6 + 0.4 * np.abs(lp(noise(d), 18)) * 3)
    return norm(x * np.sin(np.linspace(0, np.pi, len(x))) ** 1.2, peak)

def squish(d=0.35, peak=0.3):
    x = bp(noise(d), 300, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 22 * t(d)))
    return norm(x * env(len(x), 0.02, 0.2), peak)

def wipe(d=0.22, peak=0.35):
    return norm(sweep_lp(noise(d), 600, 5000) * env(int(d * SR), 0.01, 0.12), peak)

def paper(d=0.5, peak=0.5):
    x = bp(noise(d), 800, 6000) * expdecay(int(d * SR), 0.06)
    th = thump(90, 0.3, 0.6, 0)[: len(x)]
    x[: len(th)] += th * 0.5
    return norm(x, peak)

def pen(d=0.3, peak=0.3):
    x = bp(noise(d), 2000, 6500) * (0.4 + 0.6 * (lp(noise(d), 40) > 0))
    return norm(x * env(len(x), 0.01, 0.08), peak)

def tape_peel(d=1.1, peak=0.4):
    n = int(d * SR)
    x = hp(noise(d), 900) * 0.2
    for _ in range(int(140 * d)):
        p = rng.integers(0, n - 200)
        x[p:p + 120] += hp(rng.standard_normal(120), 1500) * rng.uniform(0.2, 1) * np.exp(-np.arange(120) / 25)
    return norm(x * np.linspace(0.4, 1, n) * env(n, 0.03, 0.2), peak)

def riser(d=3.0, peak=0.35):
    tt = t(d)
    x = sweep_lp(noise(d), 200, 6000) * 0.6 + np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 900, len(tt))) / SR) * 0.25
    return norm(x * (tt / d) ** 2.2, peak)

def lamp(d=1.4, peak=0.4):
    """o foco acende: estalo do interruptor + baque curto + zumbido que some"""
    n = int(d * SR)
    x = np.zeros(n)
    c = hp(noise(0.02), 1500) * np.linspace(1, 0, int(0.02 * SR))
    x[: len(c)] += c
    th = thump(110, 0.3, 0.5, 0)
    x[: len(th)] += th * 0.6
    tt = t(d)
    hum = (np.sin(2 * np.pi * 100 * tt) * 0.5 + np.sin(2 * np.pi * 200 * tt) * 0.2) * np.clip(tt / 0.15, 0, 1) * np.exp(-tt / 0.9)
    return norm(x + hum * 0.4, peak)

def gamma_hum(d=0.8, peak=0.25):
    tt = t(d)
    x = np.sin(2 * np.pi * np.cumsum(np.linspace(220, 660, len(tt))) / SR) * np.sin(np.linspace(0, np.pi, len(tt)))
    return norm(x + 0.1 * bp(noise(d), 3000, 8000), peak)

def pop(peak=0.18):
    d = 0.06
    tt = t(d)
    return norm(np.sin(2 * np.pi * 900 * tt) * np.exp(-tt / 0.012) + bp(noise(d), 1500, 4000) * np.exp(-tt / 0.006) * 0.3, peak)


# ── trilha ambiente própria (sem licença de terceiros) ─────────────────────
def pad_music(total):
    """acordes lentos em Ré: D(add9) · Bm7 · G(maj7) · A(sus4→3), vozes seno+triângulo com chorus"""
    tt = t(total)
    out = np.zeros(len(tt))
    notes = {"D": 146.83, "E": 164.81, "F#": 185.0, "G": 196.0, "A": 220.0, "B": 246.94, "C#": 277.18}
    prog = [["D", "F#", "A", "E"], ["B", "D", "F#", "A"], ["G", "B", "D", "F#"], ["A", "D", "E", "C#"]]
    seg = 7.5
    for k in range(int(total / seg) + 1):
        chord = prog[k % 4]
        s0 = int(k * seg * SR)
        n = int((seg + 2.5) * SR)
        tl = np.arange(n) / SR
        e = np.clip(tl / 2.2, 0, 1) * np.clip((seg + 2.5 - tl) / 2.5, 0, 1)
        voice = np.zeros(n)
        for i, nm in enumerate(chord):
            f = notes[nm] * (2 if i == 3 else 1)
            for det in (-0.004, 0.0, 0.005):
                ph = 2 * np.pi * f * (1 + det) * tl
                voice += np.sin(ph) * 0.5 + (2 / np.pi) * np.arcsin(np.sin(ph)) * 0.15
        voice += np.sin(2 * np.pi * notes[chord[0]] / 2 * tl) * 0.8  # baixo
        seg_ = voice * e
        end = min(len(out), s0 + n)
        out[s0:end] += seg_[: end - s0]
    out = lp(out, 2200)
    return norm(out, 1.0)

def reverb(x, secs=2.2, wet=0.25, pre=0.02):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (secs / 6.9 * SR))
    ir = lp(ir, 5000)
    ir = np.concatenate([np.zeros(int(pre * SR)), ir])
    y = signal.fftconvolve(x, ir)[: len(x)]
    y = y / (np.abs(y).max() + 1e-9) * np.abs(x).max()
    return x * (1 - wet) + y * wet


# ── narração: tratamento de estúdio ────────────────────────────────────────
def load_mp3(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)

def compress(x, thr_db=-20, ratio=3.0, att=0.005, rel=0.08):
    envl = np.abs(signal.hilbert(x))
    envl = lp(envl, 30, 1)
    g_db = np.minimum(0, (thr_db - 20 * np.log10(envl + 1e-9)) * (1 - 1 / ratio))
    return x * 10 ** (g_db / 20)

# cadeia de estúdio medida na voz do ElevenLabs v4 (reels da história e da prótese, LACP-PB, set/2026):
# excesso em 160–400 Hz, buraco em 2,5–4 kHz, "s" forte em 6–10 kHz. Ligue com CADEIA_VOZ = "elevenlabs" em roteiro/falas.py.
CADEIA_ELEVENLABS = ",".join([
    "highpass=f=80:poles=2",                                # tira ronco e graves sem função
    "equalizer=f=300:t=q:w=1.1:g=-2.5",                     # desembola (região "de caixa")
    "equalizer=f=3200:t=q:w=1.0:g=3",                        # presença: a voz vem pra frente
    "equalizer=f=7500:t=q:w=1.4:g=-2",                       # amacia o brilho áspero
    "deesser=i=0.35:m=0.5:f=0.5",                            # "s" sem chiado
    "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=90:knee=4",     # 1º estágio: segura os picos
    "acompressor=threshold=-16dB:ratio=2:attack=30:release=300:knee=6",     # 2º estágio: nivela as frases
])


def filtrar(x, cadeia):
    """passa o sinal por um filtro do ffmpeg (mono, SR)"""
    pcm = np.clip(x, -1, 1).astype(np.float32).tobytes()
    out = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", cadeia,
                          "-f", "f32le", "-ar", str(SR), "-ac", "1", "-"], input=pcm, capture_output=True, check=True).stdout
    y = np.frombuffer(out, dtype=np.float32).astype(np.float64)
    return np.pad(y, (0, max(0, len(x) - len(y))))[: len(x)]


def sala(x, dec=0.55, wet_db=-19.0, pre=0.016, seed=7):
    """sala pequena e escura: reflexões iniciais + cauda curta, só entre 300 Hz e 5,5 kHz (não embola nem chia)"""
    r = np.random.default_rng(seed)
    n = int(dec * SR)
    ir = np.zeros(int(pre * SR) + n)
    for t_, g in [(0.007, 0.55), (0.013, 0.42), (0.019, 0.35), (0.027, 0.28), (0.036, 0.22)]:  # reflexões iniciais
        ir[int((pre + t_) * SR)] += g * (1 if r.random() > 0.5 else -1)
    cauda = r.standard_normal(n) * np.exp(-np.arange(n) / (dec / 6.9 * SR))
    ir[int(pre * SR):] += 0.35 * cauda
    ir = bp(ir, 300, 5500)
    w = signal.fftconvolve(x, ir)[: len(x)]
    w *= np.sqrt(np.mean(x ** 2) / (np.mean(w ** 2) + 1e-12))
    return x + w * db(wet_db)


def voice_track(VO, N):
    try:
        import falas  # roteiro/falas.py (audio_mix.py põe roteiro/ no caminho)
    except ImportError:
        falas = None
    sem_voz = set(getattr(falas, "SEM_VOZ", ()))  # falas só na tela: sem áudio
    v = np.zeros(N)
    for l in VO["lines"]:
        if l["id"] in sem_voz:
            continue
        x = load_mp3(os.path.join(ROOT, "public", "vo", f"{l['id']}.mp3"))
        s = int(l["audioStart"] * SR)
        v[s:s + len(x)] += x[: max(0, N - s)]
    if getattr(falas, "CADEIA_VOZ", "") == "elevenlabs":
        v = sala(filtrar(v, CADEIA_ELEVENLABS))
        return norm(v, db(-3))
    v = hp(v, 85)
    # presença suave (+2 dB em 3 kHz) e corpo (+1,5 dB em 180 Hz)
    v = v + 0.26 * bp(v, 2200, 4500) + 0.18 * bp(v, 120, 260)
    v = compress(v, -22, 2.6)
    v = reverb(v, 0.45, 0.07, 0.008)  # "sala" curta: tira a secura de estúdio sintético
    return norm(v, db(-3))


def write(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", path], input=pcm)



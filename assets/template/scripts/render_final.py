"""Render final + pacote de entrega em out/entrega/.

  1. renderiza o vídeo em 1080×1920 (H.264, CRF 16) sem áudio
  2. monta com o áudio normalizado para Reels (−14 LUFS, pico −1 dBTP) → reel_final.mp4
     (e reel_final_trilha.mp4 se existir public/audio/mix_music.wav)
  3. capas: capa_reel.png (1080×1920) e capa_grid.png (1080×1350)
  4. legendas.srt
Uso: python scripts/render_final.py [--escala 0.5] [--so-capas]
"""
import os, subprocess, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "out", "entrega")
os.makedirs(OUT, exist_ok=True)
NPX = "npx.cmd" if os.name == "nt" else "npx"
args = sys.argv[1:]
scale = args[args.index("--escala") + 1] if "--escala" in args else "1"


def run(cmd, **kw):
    print("›", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=ROOT, **kw)


def loudnorm_mux(video, audio, out):
    # dois passes do loudnorm dariam precisão de ±0,1 LU; um passe com limitador já fica em ±0,5 LU
    run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
         "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
         "-shortest", "-movflags", "+faststart", out])


t0 = time.time()
if "--so-capas" not in args:
    silent = os.path.join(ROOT, "out", "reel_sem_audio.mp4")
    run([NPX, "remotion", "render", "Reel", silent, f"--scale={scale}", "--crf=16", "--codec=h264",
         "--pixel-format=yuv420p", "--props={\"audio\":\"none\"}", "--muted"])
    loudnorm_mux(silent, os.path.join(ROOT, "public", "audio", "mix_sfx.wav"), os.path.join(OUT, "reel_final.mp4"))
    music = os.path.join(ROOT, "public", "audio", "mix_music.wav")
    if os.path.exists(music):
        loudnorm_mux(silent, music, os.path.join(OUT, "reel_final_trilha.mp4"))
run([NPX, "remotion", "still", "CapaReel", os.path.join(OUT, "capa_reel.png")])
run([NPX, "remotion", "still", "CapaGrid", os.path.join(OUT, "capa_grid.png")])
run([sys.executable, os.path.join(ROOT, "scripts", "make_srt.py")])
print(f"\nentrega pronta em {OUT}  ({(time.time() - t0) / 60:.1f} min)")

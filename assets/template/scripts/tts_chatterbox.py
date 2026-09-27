"""Voz de nova geração, local e grátis: Chatterbox Multilingual (Resemble AI, licença MIT).

Clona o TIMBRE de uma referência (a voz do edge-tts já aprovada, ou uma gravação humana curta) e gera a fala com a prosódia
de um modelo expressivo moderno: respira, varia a entonação e soa menos "leitura".
Roda no ambiente separado ~/.cache/tts-venv (torch CPU). Gera WAVs; depois rode
scripts/vo_from_wavs.py (Python normal) para transcrever, conferir e montar o vo.json.

Instalação (uma vez, ~3 GB): ver references/07-voz-e-som.md.
Referência: public/vo_ref/referencia.wav, 10 a 20 s da voz desejada, mono.
Uso: ~/.cache/tts-venv/Scripts/python.exe scripts/tts_chatterbox.py [ids...] [--teste]
"""
import os, re, sys, time
import torch
import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "roteiro"))
import falas  # noqa: E402
LINES = falas.LINES

OUT = os.path.join(ROOT, "public", "vo_cb")
REF = os.path.join(ROOT, "public", "vo_ref", "referencia.wav")
os.makedirs(OUT, exist_ok=True)

# intenção por fala: exaggeration (emoção) e cfg (ritmo; menor = mais pausado e natural)
# ajuste fino opcional em roteiro/falas.py: ESTILO = {"id": (exaggeration, cfg)}
ESTILO = {"gancho": (0.55, 0.45), **getattr(falas, "ESTILO", {})}
PADRAO = (0.45, 0.45)


def falado(text):
    """{exibido|falado} → falado; números por extenso vão para a voz"""
    return re.sub(r"\{([^|}]+)\|([^}]+)\}", lambda m: m.group(2), text)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ids = set(args) if args else None
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    t0 = time.time()
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    print(f"modelo carregado em {time.time() - t0:.0f}s")
    for lid, text, pause, scene in LINES:
        if ids and lid not in ids:
            continue
        if not ids and os.path.exists(os.path.join(OUT, f"{lid}.wav")):
            continue  # sem ids: só gera o que falta
        ex, cfg = ESTILO.get(lid, PADRAO)
        seed = int(os.environ.get("SEED_" + lid, "7"))
        torch.manual_seed(seed)
        t1 = time.time()
        wav = model.generate(falado(text), language_id="pt", audio_prompt_path=REF, exaggeration=ex, cfg_weight=cfg)
        sf.write(os.path.join(OUT, f"{lid}.wav"), wav.squeeze(0).cpu().numpy().astype(np.float32), model.sr)
        dur = wav.shape[-1] / model.sr
        print(f"{lid:9s} {dur:5.2f}s de fala em {time.time() - t1:5.1f}s  (seed {seed})")


if __name__ == "__main__":
    main()

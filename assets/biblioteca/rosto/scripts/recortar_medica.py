"""Recorta as tomadas da folha da médica (public/personagem/fonte/medica_folha.png, caixas em caixas.json):
amplia 4× (Real-ESRGAN, scripts/ampliar.py), tira o fundo por IA (rembg isnet), fica com o maior pedaço (sem mão
vizinha), e troca o azul-marinho do pijama por vinho escuro da paleta (no vídeo, azul é só do filtro).
Saída: public/personagem/x4/<nome>.png"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from ampliar import ampliar, MODELO
import onnxruntime as ort
from rembg import remove, new_session
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
F = os.path.join(ROOT, "public", "personagem", "fonte")
OUT = os.path.join(ROOT, "public", "personagem", "x4"); os.makedirs(OUT, exist_ok=True)
B = json.load(open(os.path.join(F, "caixas.json")))
folha = Image.open(os.path.join(F, "medica_folha.png")).convert("RGB")
sess = ort.InferenceSession(MODELO, providers=["CPUExecutionProvider"])
rb = new_session("isnet-general-use")
so = sys.argv[1:] or list(B)
for k in so:
    big = ampliar(folha.crop(tuple(B[k])), sess)
    rgba = remove(big, session=rb)
    a = np.asarray(rgba).copy()
    al = a[..., 3] > 40
    lab, n = ndimage.label(al)
    if n > 1:
        tam = ndimage.sum(al, lab, range(1, n + 1))
        a[..., 3][lab != (1 + int(np.argmax(tam)))] = 0
    # azul-marinho (pijama) → vinho escuro, preservando a luz
    rgb = a[..., :3].astype(np.float32) / 255
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    azul = (b > r + 0.08) & (b > g + 0.04) & (rgb.max(-1) < 0.62)
    lum = (0.3 * r + 0.59 * g + 0.11 * b)[..., None]
    vinho = np.array([0.42, 0.13, 0.10]) * (lum / 0.2) ** 0.9
    rgb = np.where(azul[..., None], np.clip(vinho, 0, 1), rgb)
    a[..., :3] = (rgb * 255).astype(np.uint8)
    Image.fromarray(a).save(os.path.join(OUT, f"{k}.png"))
    print("ok", k, a.shape[1], a.shape[0], flush=True)

"""Mapa de profundidade para transformar uma imagem recortada (PNG com alfa) em relevo 2.5D.

Uso: python scripts/prep_depth.py public/img/figura.png [volumes.json]
Saída: public/img/figura_depth.png (metade da resolução, 8 bits, suavizado)

Como funciona (o que deu certo com a Vênus da LACP):
  1) "infla" a silhueta: distância até a borda vira um perfil arredondado
  2) volumes anatômicos opcionais (elipses com altura) dão forma de cabeça, tórax, ombros...
     volumes.json = [[cx, cy, rx, ry, altura], ...] em coordenadas normalizadas (0–1, y para baixo)
  3) um pouco da luminância da própria arte (tons claros = superfícies voltadas para a luz)
Revise o resultado olhando o PNG: branco = perto da câmera.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage


def main(src, vols_path=None):
    im = Image.open(src).convert("RGBA")
    W, H = im.size
    a = np.asarray(im).astype(np.float32) / 255.0
    alpha = a[..., 3] > 0.5
    base = np.sqrt(np.clip(ndimage.distance_transform_edt(alpha) / (0.22 * W), 0, 1))
    yy, xx = np.mgrid[0:H, 0:W]
    u, v = xx / W, yy / H
    vol = np.zeros((H, W), np.float32)
    vols = json.load(open(vols_path)) if vols_path else []
    for cx, cy, rx, ry, h in vols:
        d = ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2
        vol += h * np.sqrt(np.clip(1 - d, 0, 1))
    lum = ndimage.gaussian_filter(0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2], 6)
    wb, wv = (0.55, 0.45) if vols else (0.9, 0.0)
    d = wb * base + wv * vol + 0.12 * (lum - lum[alpha].mean())
    d = ndimage.gaussian_filter(ndimage.gaussian_filter(d, 10) * alpha, 3)
    d = (d - d.min()) / (d.max() - d.min() + 1e-9)
    out = os.path.splitext(src)[0] + "_depth.png"
    Image.fromarray((d * 255).astype(np.uint8)).resize((W // 2, H // 2), Image.LANCZOS).save(out)
    print("ok ->", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)

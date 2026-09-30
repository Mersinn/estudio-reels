"""A médica no meio-termo entre a personagem do ChatGPT e o preceptor da sutura (molde Kurzgesagt aprovado):
mantém o desenho limpo dela e só (1) achata o sombreado de render 3D preservando as bordas (formas chapadas, sem
manchas), (2) divide a luz em poucas faixas com transição suave (o "volume" do molde), (3) aquece a paleta: sombras
tingidas de terra, pele pêssego, pijama terra, jaleco creme (como o preceptor), (4) acende a luz de borda quente do
alto à direita. Saída: public/personagem/gravura/<nome>.png"""
import os, sys
import cv2
import numpy as np
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IN = os.path.join(ROOT, "public", "personagem", "x4")
OUT = os.path.join(ROOT, "public", "personagem", "gravura"); os.makedirs(OUT, exist_ok=True)

def faixas(v, n=5, suave=0.18):
    """quantiza a luz em n faixas, com rampa suave entre elas (não degrau duro)"""
    x = v * n
    base = np.floor(x)
    f = x - base
    f = np.clip((f - (1 - suave)) / suave, 0, 1)
    return (base + f * f * (3 - 2 * f)) / n

def estilizar(nome):
    bgra = cv2.imread(os.path.join(IN, nome), cv2.IMREAD_UNCHANGED)
    bgr, al = bgra[..., :3], bgra[..., 3].astype(np.float32) / 255
    h, w = al.shape
    s = 1400 / max(h, w) if max(h, w) > 1400 else 1.0
    peq = cv2.resize(bgr, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA) if s < 1 else bgr
    liso = cv2.edgePreservingFilter(peq, flags=cv2.RECURS_FILTER, sigma_s=50, sigma_r=0.28)
    liso = cv2.bilateralFilter(liso, 9, 40, 9)
    if s < 1:
        liso = cv2.resize(liso, (w, h), interpolation=cv2.INTER_CUBIC)
    hsv = cv2.cvtColor(liso, cv2.COLOR_BGR2HSV).astype(np.float32)
    v = hsv[..., 2] / 255
    hsv[..., 2] = faixas(v, 5) * 255 * 0.55 + v * 255 * 0.45
    img = cv2.cvtColor(hsv.clip(0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32) / 255
    rgb = img[..., ::-1]
    lum = (rgb @ np.array([0.3, 0.59, 0.11]))[..., None]
    # aquece: sombras para terra/ink quente, luzes para creme; mantém a cor própria de cada parte
    sombra = np.array([0.36, 0.16, 0.10]); luz = np.array([1.0, 0.965, 0.93])
    grade = sombra * (1 - lum) + luz * lum
    rgb = rgb * 0.7 + grade * lum * 0.3 + rgb * (grade - 0.5) * 0.12
    rgb = rgb * np.array([1.03, 0.99, 0.94])
    # luz de borda quente (alto à direita)
    m = (al > 0.5).astype(np.float32)
    dent = ndimage.distance_transform_edt(m)
    gy, gx = np.gradient(ndimage.gaussian_filter(m, 5))
    virado = np.clip((-gx * 0.8 + gy * 0.6) * 45, 0, 1)
    borda = (np.clip(1 - dent / (0.006 * max(h, w)), 0, 1) * virado * m)[..., None]
    rgb = rgb * (1 - 0.5 * borda) + np.array([1.0, 0.91, 0.8]) * 0.5 * borda
    out = np.dstack([(rgb.clip(0, 1) * 255)[..., ::-1], al * 255]).astype(np.uint8)
    cv2.imwrite(os.path.join(OUT, nome), out)
    print("ok", nome, flush=True)

for n in (sys.argv[1:] or sorted(os.listdir(IN))):
    estilizar(n if n.endswith(".png") else n + ".png")

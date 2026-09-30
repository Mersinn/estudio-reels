"""Mapa de profundidade de cada imagem da personagem (Depth Anything V2 small, ONNX, CPU) para a câmera em paralaxe
2.5D (src/projeto/TomadaRelief.tsx na biblioteca "protese" do estudio-reels). Nasceu no reel da prótese (set/2026).
Modelo (~99 MB): https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx
Entrada: public/personagem/x4/cNN.png (ampliadas por scripts/ampliar.py) · Saída: public/personagem/prof/cNN.png
(claro = perto, metade da resolução, suavizado). Uso: python scripts/profundidade.py [modelo.onnx]"""
import glob, os, sys
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

MOD = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("MODELO_PROF", os.path.join(r"C:\modelos" if os.name == "nt" else os.path.expanduser("~/modelos"), "depth-anything-v2-small.onnx"))
sess = ort.InferenceSession(MOD, providers=["CPUExecutionProvider"])
os.makedirs("public/personagem/prof", exist_ok=True)
for f in sorted(glob.glob("public/personagem/x4/c[0-9][0-9].png")):
    im = Image.open(f).convert("RGB")
    w, h = im.size
    k = 518 / min(w, h)
    W, H = int(round(w * k / 14)) * 14, int(round(h * k / 14)) * 14
    a = np.asarray(im.resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
    a = (a - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    d = sess.run(None, {"pixel_values": a.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    d = (d - np.percentile(d, 1)) / (np.percentile(d, 99) - np.percentile(d, 1) + 1e-6)
    out = Image.fromarray((np.clip(d, 0, 1) * 255).astype(np.uint8)).resize((w // 2, h // 2), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3))
    out.save(os.path.join("public/personagem/prof", os.path.basename(f)))
    print("ok", f)

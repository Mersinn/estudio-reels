"""Amplia uma imagem 4× com o Real-ESRGAN x4plus (ONNX oficial da Qualcomm AI Hub, roda na CPU, ~36 s por imagem).
Nasceu no reel da prótese (set/2026): as tomadas da personagem que o Emerson gera no ChatGPT vêm em folhas com
painéis de ~300–470 px; ampliadas 4×, cabem em tela cheia sem borrar (rosto nítido, sem "plástico").
Modelo (uma vez só, ~62 MB): https://huggingface.co/qualcomm/Real-ESRGAN-x4plus → release_assets.json →
  real_esrgan_x4plus-onnx-float.zip; descompacte e aponte MODELO_ESRGAN para o .onnx (o .data fica ao lado).
Uso: python scripts/ampliar.py entrada.png saida.png
"""
import os, sys
import numpy as np
import onnxruntime as ort
from PIL import Image

MODELO = os.environ.get("MODELO_ESRGAN", os.path.join(r"C:\modelos" if os.name == "nt" else os.path.expanduser("~/modelos"), "real_esrgan_x4plus-onnx-float", "real_esrgan_x4plus.onnx"))
T, OV, S = 128, 16, 4  # tile, sobreposição, escala


def ampliar(img: Image.Image, sess) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255.0
    h, w, _ = a.shape
    ph, pw = max(h, T), max(w, T)
    a = np.pad(a, ((0, ph - h), (0, pw - w), (0, 0)), mode="reflect")
    out = np.zeros((ph * S, pw * S, 3), np.float32)
    peso = np.zeros((ph * S, pw * S, 1), np.float32)
    # janela suave para misturar as costuras entre os ladrilhos
    r = np.minimum(np.arange(T * S) + 1, T * S - np.arange(T * S)).astype(np.float32)
    r = np.clip(r / (OV * S), 0, 1)
    jan = (r[:, None] * r[None, :])[..., None] + 1e-4
    passo = T - OV
    ys = list(range(0, ph - T, passo)) + [ph - T]
    xs = list(range(0, pw - T, passo)) + [pw - T]
    nome = sess.get_inputs()[0].name
    for y in ys:
        for x in xs:
            tile = a[y:y + T, x:x + T].transpose(2, 0, 1)[None]
            up = sess.run(None, {nome: tile})[0][0].transpose(1, 2, 0)
            out[y * S:(y + T) * S, x * S:(x + T) * S] += up * jan
            peso[y * S:(y + T) * S, x * S:(x + T) * S] += jan
    out = (out / peso)[: h * S, : w * S]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


if __name__ == "__main__":
    sess = ort.InferenceSession(MODELO, providers=["CPUExecutionProvider"])
    ampliar(Image.open(sys.argv[1]), sess).save(sys.argv[2])
    print("ok", sys.argv[2])

"""Gera imagem de personagem/objeto pela API (Gemini imagem; reserva: OpenAI gpt-image-1).
Uso: python scripts/gerar_imagem.py <saida.png> "<prompt>" [--openai] [--tam 1024x1536]
Chaves em ~/.config/watch/.env (GEMINI_API_KEY / OPENAI_API_KEY)."""
import base64, json, os, sys, urllib.request, urllib.error
def chave(n):
    if os.environ.get(n): return os.environ[n]
    for l in open(os.path.expanduser("~/.config/watch/.env"), encoding="utf-8"):
        if l.startswith(n + "="): return l.split("=", 1)[1].strip().strip('"')
saida, prompt = sys.argv[1], sys.argv[2]
tam = sys.argv[sys.argv.index("--tam") + 1] if "--tam" in sys.argv else "1024x1536"
def gemini(modelo):
    body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["IMAGE", "TEXT"], "imageConfig": {"aspectRatio": "2:3"}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent", data=json.dumps(body).encode(), headers={"x-goog-api-key": chave("GEMINI_API_KEY"), "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=300))
    for p in d["candidates"][0]["content"]["parts"]:
        if "inlineData" in p: return base64.b64decode(p["inlineData"]["data"])
    raise RuntimeError("sem imagem: " + json.dumps(d)[:300])
def openai():
    body = {"model": "gpt-image-1", "prompt": prompt, "size": tam, "quality": "high"}
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=json.dumps(body).encode(), headers={"Authorization": "Bearer " + chave("OPENAI_API_KEY"), "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=300))
    return base64.b64decode(d["data"][0]["b64_json"])
img = None
if "--openai" not in sys.argv:
    for m in ("gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image-preview", "gemini-3-pro-image", "gemini-3-pro-image-preview", "gemini-2.5-flash-image"):
        try: img = gemini(m); print("gemini", m); break
        except urllib.error.HTTPError as e: print(m, e.code, e.read().decode()[:200])
        except Exception as e: print(m, e)
if img is None: img = openai(); print("openai gpt-image-1")
open(saida, "wb").write(img); print("ok", saida)

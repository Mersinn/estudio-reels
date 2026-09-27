"""Gera legendas.srt a partir de src/data/vo.json (tempo por palavra).
Blocos de até ~38 caracteres e no máximo 2 linhas, sem atravessar uma fala."""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VO = json.load(open(os.path.join(ROOT, "src", "data", "vo.json"), encoding="utf-8"))
OUT = os.path.join(ROOT, "out", "entrega", "legendas.srt")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
MAX = 38


def ts(s):
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


blocks = []
for l in VO["lines"]:
    cur = []
    for w in l["words"]:
        txt = " ".join(x["w"] for x in cur + [w])
        # quebra em pontuação forte ou quando passa do limite
        if cur and (len(txt) > MAX or cur[-1]["w"][-1] in ".?!:"):
            blocks.append(cur)
            cur = []
        cur.append(w)
    if cur:
        blocks.append(cur)

with open(OUT, "w", encoding="utf-8") as f:
    for i, b in enumerate(blocks):
        start = b[0]["s"]
        nxt = blocks[i + 1][0]["s"] if i + 1 < len(blocks) else b[-1]["e"] + 1.2
        end = min(b[-1]["e"] + 0.5, nxt - 0.02)
        text = " ".join(w["w"] for w in b)
        f.write(f"{i + 1}\n{ts(start)} --> {ts(end)}\n{text}\n\n")
print(f"{len(blocks)} blocos -> {OUT}")

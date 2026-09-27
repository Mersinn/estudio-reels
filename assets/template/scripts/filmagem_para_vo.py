"""Modo FILMAGEM: transforma um corte vertical já pronto (aula, entrevista, depoimento) no relógio do motor.

Em vez de roteiro -> voz sintética, a fala real vira o src/data/vo.json. A partir daí legenda
em pilha, rótulos, SFX e cenas de motion se prendem às palavras exatamente como num reel narrado.

  1. copia o vídeo para public/filmagem/corte.mp4 (a composição toca o áudio dele)
  2. transcreve com tempo por palavra (faster-whisper, local e grátis)
  3. quebra em falas: pausa >= 0,45 s, ponto final/interrogação, ou 12 palavras
  4. grava src/data/vo.json (tempos = tempos do clipe, sem re-temporizar)
     e docs/LEGENDAS_RASCUNHO.ts, uma decupagem inicial para a direção de arte refinar

Aceita também o transcript da corte-viral ou da motion-vox ([{"w","t","e"}] ou {"words": [...]}),
sem transcrever de novo:  --transcript caminho.json

Uso: python scripts/filmagem_para_vo.py caminho/do/corte.mp4 [--transcript t.json] [--modelo small]
"""
import argparse, json, os, re, shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PAUSA, MAX_PALAVRAS = 0.45, 12
VAZIAS = set("a o e é de da do das dos que em no na nos nas um uma pra para com por se não mais "
             "isso esse essa isto ele ela eles elas eu você nós ao aos à às como mas ou já tem foi ser "
             "está era muito bem aí então lá cá só também".split())


def ler_transcript(path):
    d = json.load(open(path, encoding="utf-8"))
    ws = d.get("words", d) if isinstance(d, dict) else d
    out = []
    for w in ws:
        txt = w.get("w") or w.get("word") or w.get("text")
        s = w.get("t", w.get("s", w.get("start")))
        e = w.get("e", w.get("end"))
        if txt and txt.strip():
            out.append((txt.strip(), float(s), float(e)))
    return out


def transcrever(video, modelo):
    from faster_whisper import WhisperModel
    m = WhisperModel(modelo, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(video, language="pt", word_timestamps=True, vad_filter=True)
    return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if w.word.strip()]


def em_falas(words):
    falas, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        fim_frase = re.search(r"[.?!…]$", w[0])
        pausa = i + 1 < len(words) and words[i + 1][1] - w[2] >= PAUSA
        if fim_frase or pausa or len(cur) >= MAX_PALAVRAS or i == len(words) - 1:
            falas.append(cur)
            cur = []
    return falas


def chave(ws):
    """palavra mais "de conteúdo" da fala: a mais longa fora da lista de vazias"""
    cand = [re.sub(r"[^\wÀ-ú]", "", w[0]) for w in ws]
    cand = [c for c in cand if c and c.lower() not in VAZIAS]
    return max(cand, key=len) if cand else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--transcript")
    ap.add_argument("--modelo", default="small")
    a = ap.parse_args()

    dst = os.path.join(ROOT, "public", "filmagem", "corte.mp4")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.abspath(a.video) != dst:
        shutil.copyfile(a.video, dst)
    words = ler_transcript(a.transcript) if a.transcript else transcrever(dst, a.modelo)
    if not words:
        raise SystemExit("nenhuma palavra reconhecida")

    lines, legendas = [], []
    for n, ws in enumerate(em_falas(words), 1):
        lid = f"f{n:02d}"
        s, e = ws[0][1], ws[-1][2]
        lines.append({"id": lid, "scene": "filmagem", "start": round(s, 3), "end": round(e, 3),
                      "audioStart": round(s, 3), "audioDur": round(e - s, 3),
                      "text": " ".join(w[0] for w in ws),
                      "words": [{"w": w[0], "s": round(w[1], 3), "e": round(w[2], 3)} for w in ws]})
        k = chave(ws)
        linha = " ".join(("*" + w[0]) if k and re.sub(r"[^\wÀ-ú]", "", w[0]) == k else w[0] for w in ws)
        legendas.append(f'  {lid}: {{ spec: "{linha}", pos: "low" }},')
    total = words[-1][2] + 0.6
    vo = os.path.join(ROOT, "src", "data", "vo.json")
    json.dump({"voice": "filmagem", "total": round(total, 3), "lines": lines},
              open(vo, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
    with open(os.path.join(ROOT, "docs", "LEGENDAS_RASCUNHO.ts"), "w", encoding="utf-8") as f:
        f.write("// Rascunho automático: uma pilha por fala, palavra-chave marcada com *.\n"
                "// Refine à mão (quebra em / e ||, ~ manuscrita só para palavra nobre) e cole em legendas.ts.\n"
                "export const LEGENDAS = {\n" + "\n".join(legendas) + "\n};\n")
    print(f"{len(lines)} falas, {total:.1f}s  ->  src/data/vo.json e docs/LEGENDAS_RASCUNHO.ts")


if __name__ == "__main__":
    main()

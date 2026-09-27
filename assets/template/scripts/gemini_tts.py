"""Vozes de personagem com o Gemini TTS (grátis na chave do AI Studio, com limite por minuto e por dia).

Gera public/vo_gem/<id>.wav para cada fala de roteiro/falas.py cuja voz seja "gemini:<Voz>".
Guarda um manifesto (texto+voz): só regenera o que mudou. Espera sozinho quando bate o limite (429).
O tom vem da voz escolhida e da pontuação: esse modelo lê em voz alta qualquer instrução no texto.

Uso: python scripts/gemini_tts.py [ids...]      (chave em ~/.config/watch/.env: GEMINI_API_KEY=...)
Depois: python scripts/tts.py (alinha as palavras e monta o vo.json com todas as vozes).
"""
import base64, hashlib, json, os, re, sys, time, urllib.error, urllib.request, wave

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "roteiro"))
import falas  # noqa: E402

MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-3.8-flash-tts")
OUT = os.path.join(ROOT, "public", "vo_gem")
MAN = os.path.join(OUT, "manifesto.json")


def chave():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    for p in (os.path.expanduser("~/.config/watch/.env"), os.path.join(ROOT, ".env")):
        if os.path.exists(p):
            for l in open(p, encoding="utf-8"):
                if l.startswith("GEMINI_API_KEY="):
                    return l.split("=", 1)[1].strip().strip('"')
    raise SystemExit("GEMINI_API_KEY não encontrada")


def falado(text):
    return re.sub(r"\{([^|}]+)\|([^}]+)\}", lambda m: m.group(2), text)


def gerar(key, voz, texto, destino):
    body = {
        "contents": [{"parts": [{"text": texto}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voz}}}},
    }
    for tentativa in range(8):
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
            data=json.dumps(body).encode(), headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        )
        try:
            d = json.load(urllib.request.urlopen(req, timeout=180))
            pcm = base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            with wave.open(destino, "wb") as w:
                w.setnchannels(1), w.setsampwidth(2), w.setframerate(24000), w.writeframes(pcm)
            return len(pcm) / 48000
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")
            if e.code in (429, 500, 503):
                m = re.search(r'"retryDelay":\s*"(\d+)', msg)
                espera = int(m.group(1)) + 3 if m else 20 * (tentativa + 1)
                if "PerDay" in msg or "per day" in msg:
                    raise SystemExit(f"limite DIÁRIO do Gemini TTS atingido; tente amanhã ou troque GEMINI_TTS_MODEL. {msg[:200]}")
                print(f"   limite/instabilidade ({e.code}); esperando {espera}s")
                time.sleep(espera)
                continue
            raise SystemExit(f"erro {e.code}: {msg[:300]}")
    raise SystemExit("falhou depois de várias tentativas")


def main():
    key = chave()
    os.makedirs(OUT, exist_ok=True)
    man = json.load(open(MAN, encoding="utf-8")) if os.path.exists(MAN) else {}
    so = set(sys.argv[1:])
    vozes = getattr(falas, "VOZES", {})
    for lid, text, _pause, _scene in falas.LINES:
        v = vozes.get(lid, "")
        if not v.startswith("gemini:") or (so and lid not in so):
            continue
        voz = v.split(":", 1)[1]
        texto = falado(text)
        h = hashlib.sha1(f"{MODEL}|{voz}|{texto}".encode()).hexdigest()[:12]
        dst = os.path.join(OUT, f"{lid}.wav")
        if man.get(lid) == h and os.path.exists(dst) and not so:
            print(f"{lid:8s} (sem mudança)")
            continue
        dur = gerar(key, voz, texto, dst)
        man[lid] = h
        json.dump(man, open(MAN, "w", encoding="utf-8"), indent=1)
        print(f"{lid:8s} {voz:9s} {dur:5.2f}s  {texto}")
        time.sleep(4)


if __name__ == "__main__":
    main()

"""Monta a narração a partir de WAVs gerados fala a fala (Chatterbox ou qualquer outra voz).

Para cada fala do roteiro:
  1. transcreve o WAV com faster-whisper (tempo por palavra) = QA de pronúncia
  2. alinha as palavras ouvidas com as do roteiro (as que o Whisper errar são interpoladas)
  3. recorta silêncio, finaliza (grave, nível) e grava public/vo/<id>.mp3
  4. reescreve src/data/vo.json com as pausas desenhadas do roteiro

Imprime a semelhança de cada fala com o texto: abaixo de 0.85, gere de novo com outra seed
(SEED_<id>=11 python tts_chatterbox.py <id>).

Uso: python scripts/vo_from_wavs.py [pasta=public/vo_cb]
"""
import difflib, json, os, re, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "roteiro"))
from falas import LINES  # noqa: E402
from align_recording import norm, script_tokens  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else os.path.join("public", "vo_cb"))
VO_DIR = os.path.join(ROOT, "public", "vo")
DATA = os.path.join(ROOT, "src", "data", "vo.json")
LEAD_IN = 0.35
PRE, POST = 0.10, 0.28  # margem de áudio antes da 1ª e depois da última palavra


def align(target, rec):
    """tempo (s, e) de cada palavra do roteiro, a partir das palavras reconhecidas"""
    sm = difflib.SequenceMatcher(None, target, [r[0] for r in rec], autojunk=False)
    got = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            got[a + k] = (rec[b + k][1], rec[b + k][2])
    t0, t1 = rec[0][1], rec[-1][2]
    times = []
    for i in range(len(target)):
        if i in got:
            times.append(got[i])
            continue
        prv = max([j for j in got if j < i], default=None)
        nxt = min([j for j in got if j > i], default=None)
        a = got[prv][1] if prv is not None else t0
        b = got[nxt][0] if nxt is not None else t1
        lo = prv if prv is not None else -1
        hi = nxt if nxt is not None else len(target)
        step = (b - a) / (hi - lo)
        times.append((a + step * (i - lo - 0.5), a + step * (i - lo + 0.5)))
    return times, sm.ratio()


def main():
    from faster_whisper import WhisperModel
    model = WhisperModel("small", device="cpu", compute_type="int8")
    os.makedirs(VO_DIR, exist_ok=True)
    t, out, ruins = LEAD_IN, [], []
    for lid, text, pause, scene in LINES:
        wav = os.path.join(SRC, f"{lid}.wav")
        toks = script_tokens(text)
        target = [w for _, ws in toks for w in ws]
        segs, _ = model.transcribe(wav, language="pt", word_timestamps=True, initial_prompt=text)
        rec = [(norm(w.word), w.start, w.end) for s in segs for w in s.words if norm(w.word)]
        if not rec:
            raise SystemExit(f"{lid}: nada reconhecido em {wav}")
        times, sim = align(target, rec)
        heard = " ".join(r[0] for r in rec)
        cut0 = max(0.0, times[0][0] - PRE)
        cut1 = times[-1][1] + POST
        mp3 = os.path.join(VO_DIR, f"{lid}.mp3")
        # finalização leve: tira grave, suaviza sibilância, nivela; fade curto nas pontas
        af = (f"highpass=f=75,deesser=i=0.35,acompressor=threshold=-20dB:ratio=2.2:attack=8:release=120,"
              f"afade=t=in:d=0.03,afade=t=out:st={cut1 - cut0 - 0.09:.3f}:d=0.09,loudnorm=I=-17:TP=-2")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ss", f"{cut0:.3f}", "-to", f"{cut1:.3f}",
                        "-af", af, "-ar", "48000", "-ac", "1", "-q:a", "2", mp3], check=True)
        lead = times[0][0] - cut0
        words, k = [], 0
        for shown, ws in toks:
            a, b = times[k][0], times[k + len(ws) - 1][1]
            words.append({"w": shown, "s": round(a - times[0][0] + t, 3), "e": round(b - times[0][0] + t, 3)})
            k += len(ws)
        speech = times[-1][1] - times[0][0]
        out.append({"id": lid, "scene": scene, "start": round(t, 3), "end": round(t + speech, 3),
                    "audioStart": round(t - lead, 3), "audioDur": round(cut1 - cut0, 3),
                    "text": re.sub(r"\{([^|}]+)\|[^}]+\}", lambda m: m.group(1), text), "words": words})
        flag = "  <-- REFAZER" if sim < 0.85 else ""
        if flag:
            ruins.append(lid)
        print(f"{lid:9s} {t:6.2f}s  fala {speech:4.2f}s  semelhança {sim:.2f}{flag}")
        if flag:
            print(f"          ouvido: {heard}")
        t += speech + pause
    json.dump({"voice": "chatterbox-multilingual", "total": round(t, 3), "lines": out},
              open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"TOTAL {t:.2f}s  ({round(t * 30)} quadros a 30fps)")
    if ruins:
        print("refazer:", " ".join(ruins))


if __name__ == "__main__":
    main()

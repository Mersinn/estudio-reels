# 07 · Voz e som

## Voz: o caminho atual (set/2026)
**Gemini TTS via API do Google AI Studio** (chave gratuita em ~/.config/watch/.env): as vozes mais naturais em pt-BR que temos sem custo.
- `python scripts/gemini_tts.py` gera as falas marcadas `gemini:<Voz>` em `roteiro/falas.py` (VOZES); `python scripts/tts.py` alinha as palavras (faster-whisper), trata e monta o vo.json.
- Personagens soam "na sala" (filtro SALA em tts.py); a narração é levada a um ritmo único (~2,55 palavras/s, atempo) e volume único.
- Não aceita instrução de estilo: qualquer instrução no texto é LIDA em voz alta, e systemInstruction é recusado. O tom vem da voz e da pontuação.
- Cota grátis curta POR MODELO e por dia (~6–12 falas): gemini-3.8-flash-tts, gemini-3.8-flash-lite-tts, gemini-3.1-flash-tts-preview, gemini-2.5-flash-preview-tts. Gere cada PERSONAGEM inteiro num mesmo modelo; confira timbre (F0) e ritmo entre modelos antes de misturar.
- Vozes usadas: Charon (preceptor), Sulafat (paciente), Leda (estudante). A assinatura do app Google AI Pro NÃO aumenta a cota da API (é outro produto); aumentar = faturamento por uso no AI Studio.
- Evite a Thalita *Multilingual* do edge-tts em narração longa: troca de sotaque em palavras técnicas. Reserva sem cota: pt-BR-FranciscaNeural com ritmo fixo.

## Voz final: ElevenLabs Eleven v4 (conta do cliente) · o fluxo que funcionou (LACP, set/2026)
O usuário gera a voz no ElevenLabs (é a conta dele; você não acessa) e manda o MP3. O vídeo se reajusta à voz.
1. **Texto para colar** (`docs/ELEVENLABS_V4.md`): o roteiro de `roteiro/falas.py` palavra por palavra, números por extenso, com direção entre colchetes (`[curious, engaging documentary narrator]`, `[dry]`, `[slowest line, warm]`). Na v4 não existe `<break>`: use `[pause]`. Uma geração com o texto inteiro (timbre igual do começo ao fim); fala nova pedida depois vem em arquivo à parte (`public/vo_eleven/<id>.mp3`, com as mesmas configurações).
2. **Encaixe no ritmo natural:** `VOZ_ARQ=public/vo_eleven/tomada.mp3 VOZ_NOME=... TEMPO=1.06 python scripts/vo_nova_voz.py`. `TEMPO` acelera pelo Rubber Band sem mudar o timbre (6% é imperceptível; o reel da história chegou a ×1,24). Falas que saíram do vídeo mas estão na tomada: `ORDEM_GRAVACAO` + `FORA_DO_VIDEO` em falas.py.
3. **Conferência obrigatória:** `python scripts/conferir_voz.py` transcreve cada fala recortada e compara com o roteiro. Só siga com todas "ok" ou com diferenças explicadas (grafia de número, "pra/para").
4. **Mixagem:** `CADEIA_VOZ = "elevenlabs"` em falas.py liga a cadeia de estúdio medida nessa voz (EQ + de-esser + 2 compressores + sala); depois `audio_mix.py` e render.
O que a v4 faz de errado e como achar (tudo aconteceu no reel da prótese):
- **Ri** nas direções `[dry]`/`[playful]` e às vezes **repete** a palavra seguinte: o corte antigo (até a próxima palavra) levava o riso e metade do "Não" para o fim da fala anterior → "riso, trava, 'não' repetido". O corte atual termina no primeiro silêncio real.
- **Inventa palavra** ("ressonância **é** a partir de"): a conferência mostra; meça a energia a cada 10 ms e, se a palavra estiver entre duas pausas, corte com transição de 10 ms (guarde o original). Na dúvida, compare com o reconhecedor rodando numa voz provisória do mesmo texto.
- **Falso alarme:** fala isolada que começa com plosiva ("Prótese") pode ser ouvida como "A hótese"; confira antes de cortar.
Instalação (uma vez só): `pip install sherpa-onnx soundfile onnxruntime opencv-python`; modelos em `C:\modelos` (ou `MODELOS=`): `sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8` (github.com/k2-fsa/sherpa-onnx → releases asr-models) para reconhecer e Rubber Band 4 (breakfastquay.com/rubberband) para o andamento. No notebook do Emerson já estão lá, junto com os modelos de ampliação (Real-ESRGAN) e profundidade (Depth Anything V2).

## Voz: quatro caminhos
| Caminho | Custo | Qualidade | Quando |
|---|---|---|---|
| **Voz humana gravada** (o usuário ou alguém da equipe) | grátis | a mais humana e didática; dá alma e autoridade | **recomendado** para a versão final |
| **edge-tts** (vozes neurais Microsoft: Thalita, Francisca, Antonio) | grátis | boa, mas ainda soa um pouco sintética | desenvolvimento, animatic, prazos curtos |
| **Chatterbox Multilingual** (Resemble AI, MIT, local na CPU) clonando o timbre da voz aprovada | grátis | mais expressiva e menos "leitura" que o edge-tts; pronúncia pt-BR conferida por transcrição | versão final sem gravação humana; ~2 min por fala numa CPU i5, gere em segundo plano |
| Higgsfield `text2speech_v2` (ElevenLabs, MiniMax…) | créditos Higgsfield | muito humana | só se a conta tiver créditos (confira com `balance`; a do Emerson está no plano grátis) |

Observação de licença: o edge-tts é gratuito, mas não tem termos de uso comercial explícitos. Registre isso em CREDITOS.md.

### Chatterbox (voz local grátis de nova geração)
> Resultado real (LACP, set/2026): em pt-BR, clonando uma voz sintética, soou **pior** que o próprio edge-tts e foi reprovado pelo cliente. O modelo é treinado sobretudo em inglês e a referência era cópia de cópia. Só vale tentar com referência **humana** limpa, e sempre com A/B antes de renderizar.
Instalação (uma vez, venv separado para não brigar com o Python do projeto):
```bash
python -m venv ~/.cache/tts-venv
~/.cache/tts-venv/Scripts/python.exe -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
~/.cache/tts-venv/Scripts/python.exe -m pip install --no-deps chatterbox-tts
~/.cache/tts-venv/Scripts/python.exe -m pip install "setuptools<81" soundfile librosa transformers diffusers safetensors resemble-perth conformer s3tokenizer omegaconf huggingface_hub
```
Armadilhas já resolvidas: `spacy-pkuseg` não compila no Windows (por isso `--no-deps`; só serve para chinês); o `resemble-perth` (marca d'água) precisa de `pkg_resources` → `setuptools<81`; `torchaudio.save` exige torchcodec → o script grava com `soundfile`.

Fluxo:
1. `public/vo_ref/referencia.wav`: 10–20 s da voz desejada (ex.: três falas do edge-tts já aprovadas concatenadas, ou uma gravação humana curta).
2. `~/.cache/tts-venv/Scripts/python.exe scripts/tts_chatterbox.py` gera `public/vo_cb/<id>.wav` (sem ids: só o que falta, então pode interromper e retomar). Intenção por fala em `ESTILO` (exaggeration 0.45–0.65, cfg 0.3–0.45; cfg menor = mais pausado).
3. Mande um A/B (3 falas na voz atual e na nova) antes de trocar: o usuário ouve, você não.
4. `python scripts/vo_from_wavs.py`: transcreve cada WAV (QA de pronúncia: semelhança < 0.85 = refazer com `SEED_<id>=11`), alinha as palavras, finaliza e reescreve `vo.json`. Depois `audio_mix.py` e render.
O Chatterbox põe marca d'água inaudível (Perth) no áudio. Registre em CREDITOS.md.

### Humanizar a voz sintética
Ritmo variado por fala (`RITMO` em `falas.py`: frases de peso −8 a −12%, frases de contexto +3 a +5%) · pausas desenhadas (não as do serviço) · texto em registro de conversa · na mixagem: passa-altas em 85 Hz, presença em 2–4,5 kHz, corpo em 120–260 Hz, compressão suave (2,6:1) e uma "sala" curta (reverb de 0,45 s a 7%), que tira a secura de estúdio sintético.

### Voz humana (o fluxo pronto)
1. Entregue `docs/GRAVACAO.md` (modelo no pacote de marca): guarda-roupa aberto ou quarto com tecido, celular a um palmo, 1 s de silêncio entre frases, pode errar e repetir a frase inteira.
2. `pip install faster-whisper` → `python scripts/align_recording.py gravacao.m4a`
3. O script limpa (passa-altas, redução de ruído, nível), transcreve palavra por palavra em pt, acha cada fala do roteiro (a **última** tentativa vale), recorta em `public/vo/<id>.mp3` e reescreve o `vo.json` com as pausas desenhadas.
4. Rode `audio_mix.py` e renderize: cortes, legendas e efeitos seguem a voz nova.

## Efeitos sonoros: sintetizados (scripts/sfx_lib.py)
Tudo gerado por código, com semente fixa: nada a licenciar e o mesmo som a cada render. Catálogo: `whoosh` (passagem/corte), `thump` (grave/batida de número/tese), `pop` (palavra do gancho), `shimmer` (brilho/revelação), `clink` (vidro), `sizzle` (brasa/crepitar), `splash`/`bubbles`/`underwater` (água), `cloth` (tecido), `squish` (pomada/gel), `wipe` (passada), `paper` (papel caindo), `pen` (caneta riscando), `tape_peel` (fita descolando), `riser` (subida para um clímax), `lamp` (luz acendendo), `gamma_hum` (varredura).

### Partitura (roteiro/trilha.py)
```python
at(word("dor", "42%"), lib.thump(58, 0.7, 1.0, 0.12), -8)   # batida no número
at(cut("dados", "tese"), lib.thump(42, 1.4, 1.0, 0.05), -5) # grave no corte seco da tese
```
Regras: efeito só onde há evento visual (corte, número, objeto que cai) · um grave marcando a tese · silêncio antes da palavra de peso ("E cada troca dói." → a brasa some, e só então o "dói") · ambiente contínuo baixo (−9 a −16 dB) com ducking de 3 dB sob a voz.

## Trilha
`pad_music` sintetiza acordes lentos (sem licença de terceiros) para a versão `mix_music.wav`. A versão principal (`mix_sfx.wav`) vai sem música, para o usuário poder usar um áudio em alta no app.

## Loudness
Mix em ~−18 LUFS; `render_final.py` normaliza na montagem para **−14 LUFS integrado, pico ≤ −1 dBTP** (padrão de Reels). Confira: `ffmpeg -i reel.mp4 -af loudnorm=print_format=summary -f null -`.

# ROTEIRO FALADO · a fonte da verdade do tempo do vídeo.
# (id, texto, silêncio depois da última palavra em segundos, cena)
# Números: {exibido|falado}  → a legenda mostra "100%", a voz diz "cem por cento".
# Depois de editar: python scripts/tts.py   (ou grave a voz e use scripts/align_recording.py)

VOZ = "pt-BR-ThalitaMultilingualNeural"  # alternativas grátis: pt-BR-FranciscaNeural, pt-BR-AntonioNeural
RITMO_PADRAO = "+3%"
# variar o ritmo por fala tira a cadência "de máquina": falas de peso mais lentas
RITMO = {"fecho": "-8%"}

LINES = [
    ("abre", "Todo vídeo deste estúdio começa pela voz.", 0.40, "abertura"),
    ("relogio", "Ela vira o relógio: cada corte cai numa palavra.", 0.45, "abertura"),
    ("dado", "Em {100%|cem por cento} das cenas.", 0.50, "dado"),
    ("fecho", "Agora é só trocar o roteiro.", 1.40, "fecho"),
]

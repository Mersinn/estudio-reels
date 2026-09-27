"""PARTITURA DE EFEITOS · cada efeito preso a uma palavra ou a um corte.
Chamado por scripts/audio_mix.py. Use as funções de scripts/sfx_lib.py (whoosh, thump, pop, shimmer,
paper, pen, splash, underwater, sizzle, cloth, tape_peel, riser, clink, lamp, squish, wipe, bubbles...).
at(segundo, som, ganho_dB) coloca o som; word(fala, trecho) e cut(falaA, falaB) dão os tempos.
"""


def partitura(at, word, cut, L, TOTAL, lib):
    at(0.0, lib.thump(46, 1.1, 1.0, 0.05), -8)                  # grave curto na abertura
    for w in L["abre"]["words"]:
        at(w["s"], lib.pop(), -16)                                # "pop" discreto por palavra do gancho
    at(word("relogio", "palavra"), lib.shimmer(1.2, 1.0, 2200), -18)
    at(cut("relogio", "dado") - 0.35, lib.paper(0.6), -10)        # a prancha de papel entra
    at(word("dado", "100%"), lib.thump(62, 0.5, 1.0, 0.12), -10)  # batida no número
    at(cut("dado", "fecho"), lib.whoosh(0.5, 300, 3000), -14)
    at(word("fecho", "roteiro"), lib.shimmer(1.6, 1.0, 1800), -15)

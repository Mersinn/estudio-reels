# QA · <tema>

## Conteúdo
- [ ] Gancho funciona SEM SOM em ≤1,5 s (imagem + texto)
- [ ] Lacuna específica aberta cedo e paga pela tese
- [ ] Cada número bate EXATAMENTE com o DOSSIE.md (vírgula decimal, unidade, comparador nomeado)
- [ ] Nada promete resultado, nada de "cura", "aprovado", "disponível" sem fonte datada
- [ ] Status regulatório / temporal revalidado na data da publicação
- [ ] Texto de tela ≤7 palavras por bloco, ≥1,2 s por bloco

## Forma
- [ ] Nada importante fora da área segura (render com props {"guides":true})
- [ ] Legenda legível em fundo claro (tone "dark") e calada sob tipografia de cena
- [ ] Nenhum trecho parado > 1,5 s sem motivo; cortes no silêncio entre falas
- [ ] Paleta e tipografia da marca; ≤3–4 elementos por quadro
- [ ] Parece "template de IA" em algum momento? (se sim, corrigir o módulo)

## Técnica
- [ ] Determinismo: o mesmo quadro renderizado 2× dá o mesmo arquivo (md5)
- [ ] Áudio: −14 LUFS, pico ≤ −1 dBTP; cada efeito cai no corte/palavra
- [ ] Créditos e licenças registrados (voz, trilha, fontes, modelos, imagens)

## Red team (1 rodada, depois corrigir só o que falhou)
1. Um especialista da área acharia algo impreciso?
2. Alguém rolando o feed pararia no 1º segundo?
3. Continua honesto se alguém assistir só até a metade?

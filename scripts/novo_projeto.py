"""Cria um projeto de Reels novo a partir do template do estudio-reels.

Uso:
  python novo_projeto.py <pasta-destino> [--marca <pasta-do-pacote-de-marca>]... [--nome <nome>] [--sem-install]

- copia assets/template para o destino (motor + projeto de demonstração que já renderiza)
- aplica, por cima, cada pacote de marca informado (ex.: lacp-reels/assets/pacote-marca): ele
  substitui src/brand/, public/img/ e pode trazer componentes próprios (ex.: src/sistema-venus/)
- instala as dependências (npm) e o Chrome de render
- se o destino estiver numa pasta virtualizada do app Claude, prepara Chrome/ffmpeg em ~/.cache
- gera a narração da demonstração (edge-tts) para o projeto já abrir funcionando
"""
import argparse, os, shutil, subprocess, sys, importlib.util

SKILL = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEMPLATE = os.path.join(SKILL, "assets", "template")
NPM = "npm.cmd" if os.name == "nt" else "npm"
NPX = "npx.cmd" if os.name == "nt" else "npx"


def sh(cmd, cwd):
    print("›", " ".join(cmd))
    return subprocess.run(cmd, cwd=cwd).returncode == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("destino")
    ap.add_argument("--marca", action="append", default=[])
    ap.add_argument("--nome")
    ap.add_argument("--sem-install", action="store_true")
    a = ap.parse_args()
    dest = os.path.abspath(a.destino)
    if os.name == "nt" and len(dest) > 180:
        sys.exit(f"caminho longo demais ({len(dest)} caracteres): o Windows limita pastas a ~260 e o npm quebra. Use um caminho mais curto.")
    if os.path.exists(dest) and os.listdir(dest):
        sys.exit(f"a pasta {dest} já existe e não está vazia")
    shutil.copytree(TEMPLATE, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns("node_modules", "out"))
    for m in a.marca:
        shutil.copytree(os.path.abspath(m), dest, dirs_exist_ok=True)
        # o pacote pode listar em _remover.txt arquivos do template que ele substitui/dispensa
        rem = os.path.join(dest, "_remover.txt")
        if os.path.exists(rem):
            for rel in open(rem, encoding="utf-8").read().split():
                alvo = os.path.join(dest, rel)
                if os.path.isfile(alvo):
                    os.remove(alvo)
            os.remove(rem)
        print("pacote de marca aplicado:", m)
    nome = a.nome or os.path.basename(dest)
    for f in ("package.json", "README.md"):
        p = os.path.join(dest, f)
        if os.path.exists(p):
            s = open(p, encoding="utf-8").read().replace("__NOME_PROJETO__", nome)
            open(p, "w", encoding="utf-8").write(s)

    faltando = [m for m in ("edge_tts", "numpy", "scipy", "PIL") if importlib.util.find_spec(m) is None]
    if faltando:
        print("\n! dependências Python ausentes:", ", ".join(faltando))
        print("  instale com: pip install edge-tts numpy scipy pillow")

    if not a.sem_install:
        sh([NPM, "install"], dest)
        sh([NPX, "remotion", "browser", "ensure"], dest)
        if "scratch-workspaces" in dest or "Packages" + os.sep + "Claude_" in dest:
            cache = os.path.join(os.path.expanduser("~"), ".cache")
            chrome_src = os.path.join(dest, "node_modules", ".remotion", "chrome-headless-shell", "win64", "chrome-headless-shell-win64")
            bins_src = os.path.join(dest, "node_modules", "@remotion", "compositor-win32-x64-msvc")
            if os.path.exists(chrome_src):
                shutil.copytree(chrome_src, os.path.join(cache, "remotion-chrome", "chrome-headless-shell-win64"), dirs_exist_ok=True)
            if os.path.exists(bins_src):
                shutil.copytree(bins_src, os.path.join(cache, "remotion-bin"), dirs_exist_ok=True)
            print("pasta virtualizada: Chrome e ffmpeg copiados para ~/.cache (remotion.config.ts já aponta para lá)")
        if not faltando:
            sh([sys.executable, os.path.join("scripts", "tts.py")], dest)

    print(f"""
projeto criado em: {dest}

próximos passos
  1. docs/BRIEFING.md e docs/DOSSIE.md        (tese, público, evidências)
  2. roteiro/falas.py  →  python scripts/tts.py  (a narração define o tempo)
  3. src/projeto/      (cenas.ts, legendas.ts, cenas/*.tsx)
  4. node scripts/stills.mjs out/rev 0.4 <quadros>   (revisão por folha de contato)
  5. roteiro/trilha.py →  python scripts/audio_mix.py
  6. python scripts/render_final.py           (MP4 + capas + SRT em out/entrega)
""")


if __name__ == "__main__":
    main()

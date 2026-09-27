// Revisão rápida: renderiza quadros avulsos numa só sessão de navegador (1–4 s por quadro).
// Uso: node scripts/stills.mjs <pasta> <escala> <quadro> [quadro...]
//      COMP=CapaReel node scripts/stills.mjs out/capa 1 0
// Depois: python scripts/sheet.py <pasta> <pasta>_folha.png 5   (folha de contato)
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const [, , outDir = "out/stills", scaleArg = "0.5", ...frames] = process.argv;
// dentro das pastas virtualizadas do app Claude, o Chrome precisa rodar de ~/.cache (ver remotion.config.ts)
const cached = path.join(os.homedir(), ".cache", "remotion-chrome", "chrome-headless-shell-win64", "chrome-headless-shell.exe");
const virtual = /scratch-workspaces|Packages[\\/]Claude_/i.test(process.cwd());
const browserExecutable = virtual && fs.existsSync(cached) ? cached : null;

const gl = process.platform === "win32" ? "angle" : "swangle"; // nuvem Linux sem GPU: software
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions: { gl } });
const envVariables = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith("REMOTION_")));
const comp = await selectComposition({ serveUrl, id: process.env.COMP ?? "Reel", puppeteerInstance: browser, inputProps: {}, envVariables, timeoutInMilliseconds: 120000 });
for (const f of frames) {
  const t0 = Date.now();
  await renderStill({
    composition: comp,
    serveUrl,
    frame: Number(f),
    output: path.join(outDir, `f${String(f).padStart(4, "0")}.png`),
    scale: Number(scaleArg),
    puppeteerInstance: browser,
    chromiumOptions: { gl },
    inputProps: {},
    envVariables,
    timeoutInMilliseconds: 120000,
  });
  console.log(`quadro ${f} ok (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
await browser.close({ silent: true });

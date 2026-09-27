/**
 * Configuração do render (CLI e Studio).
 * - "angle": usa a GPU (inclusive integrada) via Direct3D no Windows; sem isso o Three.js cai no software.
 *   Fora do Windows (nuvem Linux, sem GPU) usa "swangle": software, mais lento, mas renderiza igual.
 * - concorrência 2: seguro para ~8 GB de RAM com cenas 3D. Suba para 4 se a máquina tiver 16 GB+.
 * - pasta virtualizada: dentro das "scratch-workspaces" do app Claude (AppData) o Windows não deixa
 *   iniciar o Chrome/ffmpeg do node_modules; nesse caso usamos cópias em ~/.cache (scripts/novo_projeto.py prepara).
 */
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer(process.platform === "win32" ? "angle" : "swangle");
Config.setConcurrency(2);
Config.setDelayRenderTimeoutInMilliseconds(120000);

const cwd = process.cwd().split(path.sep).join("/");
const virtualizada = cwd.includes("scratch-workspaces") || cwd.includes("Packages/Claude_");
const cache = path.join(os.homedir(), ".cache");
const chrome = path.join(cache, "remotion-chrome", "chrome-headless-shell-win64", "chrome-headless-shell.exe");
const bins = path.join(cache, "remotion-bin");
const barra = (p: string) => p.split(path.sep).join("/");
if (virtualizada && fs.existsSync(chrome)) Config.setBrowserExecutable(barra(chrome));
if (virtualizada && fs.existsSync(bins)) Config.setBinariesDirectory(barra(bins));

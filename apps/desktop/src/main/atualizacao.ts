import { app, BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { UpdateState } from "@gravae/shared";

import { writeSwap, prepareMac } from "./atualizacao-mac.js";
import { isDev } from "./config.js";
import { isMoreNew } from "./versao.js";

const REPO = "thiagob7/Ravox-Chat";
const FILE = process.platform === "darwin" ? "ravox-chat-mac.dmg" : "ravox-chat-win.exe";

const INTERVAL_MS = 6 * 60 * 60 * 1000;

const DELAY_INITIAL_MS = 10_000;

const INTERVAL_BY_FOCUS_MS = 15 * 60 * 1000;

function packetInstalled(): string | null {
  if (process.platform !== "darwin") return null;

  const executable = app.getPath("exe");
  const packet = path.resolve(executable, "..", "..", "..");

  return packet.endsWith(".app") ? packet : null;
}

function fire(program: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const doProcess = spawn(program, args, { detached: true, stdio: "ignore" });

    doProcess.once("spawn", () => {
      doProcess.unref();
      resolve();
    });

    doProcess.once("error", reject);
  });
}

interface Published {
  version: string;
  url: string;
  size: number;
}

async function lastPublished(): Promise<Published> {
  const reply = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!reply.ok) throw new Error(`GitHub respondeu ${reply.status}`);

  const data = (await reply.json()) as {
    tag_name?: string;
    assets?: { name: string; browser_download_url: string; size: number }[];
  };

  const file = data.assets?.find((a) => a.name === FILE);
  if (!data.tag_name || !file) throw new Error("A release não tem o arquivo desta plataforma.");

  return {
    version: data.tag_name.replace(/^v/, ""),
    url: file.browser_download_url,
    size: file.size,
  };
}

export function createUpdater(onChange: (state: UpdateState) => void) {
  let state: UpdateState = {
    current: app.getVersion(),
    available: null,
    phase: "ociosa",
    progress: 0,
    error: null,
  };

  let prepared: string | null = null;
  let working = false;

  const change = (patch: Partial<UpdateState>) => {
    state = { ...state, ...patch };
    onChange(state);
  };

  async function lookup(): Promise<UpdateState> {
    if (isDev || !app.isPackaged) return state;
    if (working || state.phase === "pronta") return state;

    working = true;
    change({ phase: "procurando", error: null });

    try {
      const published = await lastPublished();
      const fresh = isMoreNew(published.version, state.current);

      change({ phase: "ociosa", available: fresh ? published.version : null });
      return state;
    } catch (error) {
      change({ phase: "erro", error: error instanceof Error ? error.message : String(error) });
      return state;
    } finally {
      working = false;
    }
  }

  async function download(): Promise<UpdateState> {
    if (isDev || !app.isPackaged || working || state.phase === "pronta") return state;
    if (!state.available) return state;

    working = true;
    change({ phase: "baixando", progress: 0, error: null });

    const folder = await mkdtemp(path.join(tmpdir(), "ravox-atualizacao-"));

    try {
      const published = await lastPublished();
      const destination = path.join(folder, FILE);

      const reply = await fetch(published.url);
      if (!reply.ok || !reply.body) throw new Error(`Download respondeu ${reply.status}`);

      let downloaded = 0;
      const counting = new TransformStream<Uint8Array, Uint8Array>({
        transform(piece, control) {
          downloaded += piece.byteLength;
          change({ progress: Math.min(downloaded / published.size, 1) });
          control.enqueue(piece);
        },
      });

      await pipeline(
        Readable.fromWeb(reply.body.pipeThrough(counting) as never),
        createWriteStream(destination),
      );

      prepared =
        process.platform === "darwin" ? await prepareMac(destination, published.version) : destination;

      change({ phase: "pronta", progress: 1 });
      return state;
    } catch (error) {
      await rm(folder, { recursive: true, force: true }).catch(() => undefined);
      change({ phase: "erro", error: error instanceof Error ? error.message : String(error) });
      return state;
    } finally {
      working = false;
    }
  }

  async function install() {
    if (state.phase === "instalando") return;

    if (!prepared || state.phase !== "pronta") {
      change({ phase: "erro", error: "Não há versão preparada para instalar. Baixe de novo." });
      return;
    }

    change({ phase: "instalando", error: null });

    try {
      if (process.platform === "darwin") {
        const packet = packetInstalled();

        if (!packet) {
          throw new Error(
            "Não achei o Ravox Chat instalado no disco. Se você abriu o app de dentro do instalador, arraste-o para a pasta Aplicativos primeiro.",
          );
        }

        const script = await writeSwap(packet, prepared);
        await fire("/bin/sh", [script]);
      } else {
        await fire(prepared, ["/S"]);
      }
    } catch (error) {
      change({
        phase: "pronta",
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    for (const appWindow of BrowserWindow.getAllWindows()) appWindow.destroy();
    app.quit();
  }

  const timers: NodeJS.Timeout[] = [];

  return {
    state: () => state,
    lookup,
    download,
    install,

    watch() {
      let last = 0;

      const round = () => {
        last = Date.now();
        void lookup().then((current) => (current.available ? download() : undefined));
      };

      const first = setTimeout(round, DELAY_INITIAL_MS);
      const clock = setInterval(round, INTERVAL_MS);

      first.unref();
      clock.unref();
      timers.push(first, clock);

      const onFocus = () => {
        if (Date.now() - last < INTERVAL_BY_FOCUS_MS) return;
        round();
      };

      app.on("browser-window-focus", onFocus);

      return () => {
        timers.forEach((t) => clearTimeout(t));
        app.off("browser-window-focus", onFocus);
      };
    },
  };
}

import path from "node:path";
import { app, BrowserWindow, nativeImage } from "electron";

import { registerUpdate } from "./atualizacao-ipc.js";
import { registerNotices } from "./avisos.js";
import { registerCache } from "./cache-ipc.js";
import { screenRegisterCapture } from "./captura-de-tela.js";
import { createWindow } from "./janela.js";
import { adoptLegacyData } from "./legacy-data.js";
import { registerLinks } from "./links.js";
import { registerLoginDesktop } from "./login-desktop.js";
import { mediaRegisterPermissions } from "./permissoes.js";
import { registerPushToTalk } from "./push-to-talk.js";
import { registerSystem } from "./sistema.js";
import { registerVersions } from "./versoes-ipc.js";

adoptLegacyData();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let appWindow: BrowserWindow | null = null;
  const loginDesktop = registerLoginDesktop();
  const links = registerLinks();

  app.on("second-instance", (_event, argv) => {
    const link = argv.find((arg) => arg.startsWith("gravae://"));

    if (link) {
      loginDesktop.receiveUrl(link);
      links.open(link);
    }

    if (!appWindow) return;
    if (appWindow.isMinimized()) appWindow.restore();
    appWindow.focus();
  });

  const pushToTalk = registerPushToTalk();
  registerVersions();
  registerSystem();
  registerCache();

  app.on("will-quit", () => pushToTalk.end());

  void app.whenReady().then(() => {
    if (process.platform === "darwin") {
      const icon = nativeImage.createFromPath(path.join(__dirname, "..", "build", "icon.png"));
      if (!icon.isEmpty()) app.dock?.setIcon(icon);
    }

    mediaRegisterPermissions();
    screenRegisterCapture();
    registerNotices();
    appWindow = createWindow();

    registerUpdate(() => appWindow);

    const openingLink = process.argv.find((arg) => arg.startsWith("gravae://"));
    if (openingLink) links.open(openingLink);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) appWindow = createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

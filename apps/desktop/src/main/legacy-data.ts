import { existsSync, readdirSync, renameSync, rmdirSync } from "node:fs";
import path from "node:path";
import { app } from "electron";

const LEGACY_FOLDER = "Gravaê Chat";

export function adoptLegacyData(userDataDir = app.getPath("userData")): string | null {
  const legacy = path.join(path.dirname(userDataDir), LEGACY_FOLDER);

  if (legacy === userDataDir || !existsSync(legacy)) return null;
  if (existsSync(userDataDir) && readdirSync(userDataDir).length > 0) return null;

  try {
    if (existsSync(userDataDir)) rmdirSync(userDataDir);
    renameSync(legacy, userDataDir);
    return userDataDir;
  } catch {
    app.setPath("userData", legacy);
    return legacy;
  }
}

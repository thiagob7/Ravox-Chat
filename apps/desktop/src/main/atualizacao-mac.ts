import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const BUNDLE = "Ravox Chat.app";

export async function prepareMac(dmg: string, versionExpected: string): Promise<string> {
  const mounted = await command("hdiutil", ["attach", "-nobrowse", "-readonly", dmg]);
  const dot = mounted
    .split("\n")
    .map((line) => line.match(/(\/Volumes\/.+)$/)?.[1]?.trim())
    .filter(Boolean)
    .pop();

  if (!dot) throw new Error("Não consegui montar o arquivo baixado.");

  try {
    const origin = path.join(dot, BUNDLE);
    await access(origin, constants.R_OK);

    const plist = await readFile(path.join(origin, "Contents", "Info.plist"), "utf8");
    const identifier = plist.match(
      /<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/,
    )?.[1];
    const version = plist.match(
      /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/,
    )?.[1];

    if (identifier !== "io.gravae.chat") throw new Error("O app baixado não é o Ravox Chat.");
    if (version !== versionExpected) {
      throw new Error(`O app baixado diz ${version}, e a release diz ${versionExpected}.`);
    }

    const kept = path.join(path.dirname(dmg), BUNDLE);
    await command("ditto", [origin, kept]);
    await command("xattr", ["-dr", "com.apple.quarantine", kept]).catch(() => "");

    return kept;
  } finally {
    await command("hdiutil", ["detach", dot, "-quiet"]).catch(() => "");
  }
}

export async function writeSwap(packet: string, fresh: string): Promise<string> {
  const script = path.join(path.dirname(fresh), "trocar.sh");

  await writeFile(
    script,
    `#!/bin/sh
set -e

# espera o app fechar de verdade (no máximo 30s)
for _ in $(seq 1 60); do
  pgrep -f ${JSON.stringify(`${packet}/Contents/MacOS/`)} >/dev/null 2>&1 || break
  sleep 0.5
done

PACOTE=${JSON.stringify(packet)}
DESTINO=${JSON.stringify(path.join(path.dirname(packet), BUNDLE))}
if [ "$DESTINO" != "$PACOTE" ] && [ -e "$DESTINO" ]; then
  DESTINO="$PACOTE"
fi

ANTIGO="$PACOTE.antigo"
rm -rf "$ANTIGO"
mv "$PACOTE" "$ANTIGO"

if ditto ${JSON.stringify(fresh)} "$DESTINO"; then
  rm -rf "$ANTIGO"
else
  # deu errado: devolve o que estava lá antes
  rm -rf "$DESTINO"
  mv "$ANTIGO" "$PACOTE"
  DESTINO="$PACOTE"
fi

open "$DESTINO"
rm -rf ${JSON.stringify(path.dirname(fresh))}
`,
    { mode: 0o755 },
  );

  return script;
}

function command(program: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const doProcess = spawn(program, args);
    let output = "";
    let error = "";

    doProcess.stdout.on("data", (d) => (output += d));
    doProcess.stderr.on("data", (d) => (error += d));
    doProcess.on("error", reject);
    doProcess.on("close", (code) =>
      code === 0 ? resolve(output) : reject(new Error(error.trim() || `${program} falhou`)),
    );
  });
}

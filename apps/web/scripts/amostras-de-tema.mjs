import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = join(HERE, "..", "src", "styles", "index.css");
const LIST = join(
  HERE,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "amostras-de-tema.json",
);

const WHERE = {
  escuro: "@theme {",
  "mais-escuro": ':root[data-tema="mais-escuro"] {',
  grafite: ':root[data-tema="grafite"] {',
  gravae: ':root[data-tema="gravae"] {',
  claro: ':root[data-tema="claro"],',
};

function block(css, opening) {
  const start = css.indexOf(opening);
  if (start < 0) throw new Error(`não achei o bloco \`${opening}\``);

  const key = css.indexOf("{", start);
  const end = css.indexOf("\n}", key);
  if (end < 0) throw new Error(`o bloco \`${opening}\` não fecha`);

  return css.slice(key, end);
}

function declared(body, name) {
  return new RegExp(`^\\s+${name}:\\s*([^;]+);`, "m").exec(body)?.[1]?.trim() ?? null;
}

function color(body, name, chain) {
  const loop = chain?.[name];

  for (const knob of loop?.names ?? []) {
    const match = declared(body, knob);
    if (match) return match;
  }

  const our = declared(body, name);

  return (our?.startsWith("var(") ? null : our) ?? loop?.reserve ?? null;
}

function themeChain(css) {
  const body = block(css, "@theme {");
  const map = {};

  for (const [, name, value] of body.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
    const names = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
    let reserve = value.trim();

    while (reserve.startsWith("var(")) {
      const virgula = reserve.indexOf(",");
      if (virgula < 0) break;
      reserve = reserve.slice(virgula + 1, reserve.lastIndexOf(")")).trim();
    }

    map[name] = { names, reserve };
  }

  return map;
}

export function extractSamples(css) {
  const byTheme = {};
  const chain = themeChain(css);

  for (const [theme, opening] of Object.entries(WHERE)) {
    const body = block(css, opening);
    const pick = (name) => {
      const match = color(body, name, chain);
      if (!match) throw new Error(`não achei ${name} em \`${opening}\``);
      return match;
    };

    byTheme[theme] = {
      sample: [pick("--color-surface-0"), pick("--color-surface-1"), pick("--color-surface-2")],
      accent: pick("--color-brand"),
    };
  }

  byTheme.sistema = {
    sample: [byTheme.claro.sample[2], byTheme.escuro.sample[2]],
    accent: byTheme.escuro.accent,
  };

  return byTheme;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = `${JSON.stringify(extractSamples(readFileSync(CSS, "utf8")), null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const current = existsSync(LIST) ? readFileSync(LIST, "utf8") : "";

    if (current !== output) {
      console.error(
        "\namostras-de-tema.json está fora de dia. Rode: yarn tokens\n",
      );
      process.exit(1);
    }

    console.log("amostras de tema em dia");
  } else {
    writeFileSync(LIST, output);
    console.log(`amostras em ${relative(HERE, LIST)}`);
  }
}

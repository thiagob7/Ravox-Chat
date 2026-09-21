const LOCKED = /\.([A-Za-z][A-Za-z0-9]*)\\\.module__([A-Za-z0-9]+)___[A-Za-z0-9]+/g;

const DIV_FRONT = /\bdiv(?=\[class\*=)/g;

export function translatePickersLocked(css: string): string {
  return css
    .replace(
      LOCKED,
      (_, file: string, part: string) => `[class*="${file}.module__${part}_"]`,
    )
    .replace(DIV_FRONT, "");
}

const ALMOST_SO_HASH = 0.7;

export function mustTranslate(css: string): boolean {
  const { stuck, loose } = countPickersDated(css);
  const total = stuck + loose;

  return total > 0 && stuck / total >= ALMOST_SO_HASH;
}

export function countPickersDated(css: string): {
  stuck: number;
  withDiv: number;
  loose: number;
} {
  return {
    stuck: new Set(css.match(LOCKED) ?? []).size,
    withDiv: new Set(css.match(/\bdiv\[class\*="[^"]+"\]/g) ?? []).size,
    loose: new Set(css.match(/\[class\*="[^"]+"\]/g) ?? []).size,
  };
}

export const THEME_CLASS: Record<string, string> = {
  dark: "theme-dark",
  "mais-escuro": "theme-coal",
  grafite: "theme-dark",
  light: "theme-light",
  gravae: "theme-dark",
};

export function markRootTheme(theme: string | undefined) {
  const root = document.documentElement;

  for (const cssClass of Object.values(THEME_CLASS)) root.classList.remove(cssClass);

  const picked = THEME_CLASS[theme ?? ""] ?? THEME_CLASS.dark;
  if (picked) root.classList.add(picked);
}

export interface ExistsReference {
  modules: string[];
  areas: string[];
}

export function filterRulesDead(css: string, exists: ExistsReference): string {
  const modules = new Set(exists.modules);
  const areas = new Set(exists.areas);

  const viva = (picker: string) => {
    const clean = picker.replace(/\\/g, "");
    const names: string[] = [];

    for (const [, modulo] of clean.matchAll(/([A-Za-z][A-Za-z0-9]*)\.module__/g)) names.push(`m:${modulo}`);
    for (const [, modulo] of clean.matchAll(/\[class\*="([A-Za-z][A-Za-z0-9]*)"\]\s*\[class\*="[A-Za-z][A-Za-z0-9]*"\]/g)) names.push(`m:${modulo}`);
    for (const [, path] of clean.matchAll(/data-flx\s*=\s*["']([^"']+)["']/g)) names.push(`a:${(path ?? "").split(".").slice(0, 2).join(".")}`);

    if (!names.length) return true;
    return names.some((n) => (n.startsWith("m:") ? modules.has(n.slice(2)) : areas.has(n.slice(2))));
  };

  let output = "";
  let i = 0;

  while (i < css.length) {
    const opens = css.indexOf("{", i);
    if (opens === -1) {
      output += css.slice(i);
      break;
    }

    const picker = css.slice(i, opens);

    const header = /@([a-z-]+)[^{}]*$/.exec(picker);
    if (header) {
      if (header[1] === "keyframes" || header[1] === "font-face" || header[1] === "property") {
        let background = 0;
        let end = opens;
        for (; end < css.length; end++) {
          if (css[end] === "{") background++;
          else if (css[end] === "}" && --background === 0) break;
        }
        output += css.slice(i, end + 1);
        i = end + 1;
        continue;
      }

      output += css.slice(i, opens + 1);
      i = opens + 1;
      continue;
    }

    if (picker.includes("}")) {
      const k = picker.lastIndexOf("}");
      output += picker.slice(0, k + 1);
      i += k + 1;
      continue;
    }

    let background = 0;
    let end = opens;
    for (; end < css.length; end++) {
      if (css[end] === "{") background++;
      else if (css[end] === "}" && --background === 0) break;
    }

    const body = css.slice(opens, end + 1);
    output += viva(picker) ? picker + body : picker.replace(/[^\n]/g, "");
    i = end + 1;
  }

  return output;
}

export function countRulesDead(css: string, exists: ExistsReference): number {
  const account = (text: string) => (text.match(/\{[^{}]*:[^{}]*\}/g) ?? []).length;
  return Math.max(0, account(css) - account(filterRulesDead(css, exists)));
}

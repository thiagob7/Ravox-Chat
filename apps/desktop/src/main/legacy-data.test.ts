import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setPath = vi.fn();
vi.mock("electron", () => ({ app: { getPath: () => "", setPath } }));

const { adoptLegacyData } = await import("./legacy-data");

let appData: string;
let current: string;
let legacy: string;

beforeEach(() => {
  appData = mkdtempSync(path.join(tmpdir(), "legacy-data-"));
  current = path.join(appData, "Ravox Chat");
  legacy = path.join(appData, "Gravaê Chat");
  setPath.mockClear();
});

afterEach(() => rmSync(appData, { recursive: true, force: true }));

describe("pasta de dados antiga", () => {
  it("vira a nova quando a nova ainda está vazia", () => {
    mkdirSync(legacy);
    writeFileSync(path.join(legacy, "Local State"), "logado");
    mkdirSync(current);

    expect(adoptLegacyData(current)).toBe(current);
    expect(readFileSync(path.join(current, "Local State"), "utf8")).toBe("logado");
    expect(existsSync(legacy)).toBe(false);
  });

  it("vira a nova quando a nova nem existe", () => {
    mkdirSync(legacy);

    expect(adoptLegacyData(current)).toBe(current);
    expect(existsSync(legacy)).toBe(false);
  });

  it("não mexe em nada quando a nova já tem dados", () => {
    mkdirSync(legacy);
    mkdirSync(current);
    writeFileSync(path.join(current, "Local State"), "novo");

    expect(adoptLegacyData(current)).toBeNull();
    expect(existsSync(legacy)).toBe(true);
    expect(readFileSync(path.join(current, "Local State"), "utf8")).toBe("novo");
  });

  it("não faz nada sem pasta antiga", () => {
    expect(adoptLegacyData(current)).toBeNull();
    expect(setPath).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";

import { firstLink, linkAt } from "./first-link";

describe("primeiro link do texto", () => {
  it("acha o link solto", () => {
    expect(firstLink("olha isso https://exemplo.com/a aqui")).toBe("https://exemplo.com/a");
  });

  it("pega só o primeiro quando há vários", () => {
    expect(firstLink("https://um.com e https://dois.com")).toBe("https://um.com");
  });

  it("não olha para o que está em bloco de código", () => {
    expect(firstLink("```\nhttps://exemplo.com\n```")).toBeNull();
  });

  it("não olha para o que está entre crases", () => {
    expect(firstLink("roda `curl https://exemplo.com` aí")).toBeNull();
  });

  it("não olha para o que está em spoiler", () => {
    expect(firstLink("||https://exemplo.com||")).toBeNull();
  });

  it("acha o link que vem depois do bloco de código", () => {
    expect(firstLink("```js\nconst a = 1;\n```\nhttps://exemplo.com")).toBe("https://exemplo.com");
  });

  it("ignora imagem, que a caixa já mostra sozinha", () => {
    expect(firstLink("https://exemplo.com/foto.png")).toBeNull();
  });

  it("devolve nada quando não há link", () => {
    expect(firstLink("bom dia")).toBeNull();
  });
});

describe("link debaixo do cursor", () => {
  it("acha quando o cursor está dentro do endereço", () => {
    expect(linkAt("veja https://exemplo.com agora", 10)).toBe("https://exemplo.com");
  });

  it("acha na primeira letra e na última", () => {
    expect(linkAt("https://exemplo.com", 0)).toBe("https://exemplo.com");
    expect(linkAt("https://exemplo.com", 19)).toBe("https://exemplo.com");
  });

  it("não acha quando o cursor está fora", () => {
    expect(linkAt("veja https://exemplo.com agora", 2)).toBeNull();
    expect(linkAt("veja https://exemplo.com agora", 27)).toBeNull();
  });

  it("deixa a pontuação colada de fora do endereço", () => {
    expect(linkAt("olha (https://exemplo.com).", 26)).toBeNull();
    expect(linkAt("olha (https://exemplo.com).", 10)).toBe("https://exemplo.com");
  });

  it("acha o segundo link quando o cursor está nele", () => {
    expect(linkAt("https://um.com e https://dois.com", 20)).toBe("https://dois.com");
  });
});

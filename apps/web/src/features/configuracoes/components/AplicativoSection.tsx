import React from "react";
import { Apple, Download, Monitor } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";

const BASE = "https://github.com/thiagob7/Ravox-Chat/releases/latest/download";

const MAC = `${BASE}/ravox-chat-mac.dmg`;
const WINDOWS = `${BASE}/ravox-chat-win.exe`;

function isWindows(): boolean {
  if (typeof navigator === "undefined") return false;

  return /win/i.test(navigator.userAgent);
}

export const AppSection: React.FC = () => (
  <div data-gc="configuracoes.aplicativo-section.div">
    <Section data-gc="configuracoes.aplicativo-section.section"
      id="baixar"
      title="Aplicativo de desktop"
      detail="A mesma conta e as mesmas conversas, numa janela só. Push-to-talk global e compartilhamento de tela funcionam melhor por aqui do que no navegador."
    >
      <div data-gc="configuracoes.aplicativo-section.div--2"
        className={cn("flex flex-col gap-3", isWindows() && "flex-col-reverse")}
      >
        <div data-gc="configuracoes.aplicativo-section.div--3" className="rounded-lg border border-line bg-surface-2 p-4">
          <p data-gc="configuracoes.aplicativo-section.p" className="flex items-center gap-2 text-sm font-medium">
            <Apple data-gc="configuracoes.aplicativo-section.apple" size={16} /> macOS — Intel e Apple Silicon
          </p>

          <Button data-gc="configuracoes.aplicativo-section.button" asChild className="mt-3 w-full">
            <a data-gc="configuracoes.aplicativo-section.a" href={MAC}>
              <Download data-gc="configuracoes.aplicativo-section.download" size={16} /> Baixar
            </a>
          </Button>

          <p data-gc="configuracoes.aplicativo-section.p--2" className="mt-3 text-xs text-ink-faint">
            Na primeira vez:{" "}
            <b data-gc="configuracoes.aplicativo-section.b">
              Ajustes do Sistema → Privacidade e Segurança → Abrir Assim Mesmo
            </b>
            .
          </p>
        </div>

        <div data-gc="configuracoes.aplicativo-section.div--4" className="rounded-lg border border-line bg-surface-2 p-4">
          <p data-gc="configuracoes.aplicativo-section.p--3" className="flex items-center gap-2 text-sm font-medium">
            <Monitor data-gc="configuracoes.aplicativo-section.monitor" size={16} /> Windows — 64 bits
          </p>

          <Button data-gc="configuracoes.aplicativo-section.button--2" asChild className="mt-3 w-full">
            <a data-gc="configuracoes.aplicativo-section.a--2" href={WINDOWS}>
              <Download data-gc="configuracoes.aplicativo-section.download--2" size={16} /> Baixar
            </a>
          </Button>

          <p data-gc="configuracoes.aplicativo-section.p--4" className="mt-3 text-xs text-ink-faint">
            Se o Windows avisar, clique em{" "}
            <b data-gc="configuracoes.aplicativo-section.b--2">Mais informações → Executar assim mesmo</b>.
          </p>
        </div>
      </div>
    </Section>
  </div>
);

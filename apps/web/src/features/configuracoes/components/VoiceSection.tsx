import React, { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Infinity as InfinityIcon,
  Keyboard,
  Mic,
  ShieldCheck,
  Video,
  Volume2,
} from "lucide-react";

import { radioOptionClass } from "~/components/ui/radio-group";
import { MacPermissions } from "~/features/app/components/PermissoesDoMac";
import { Button } from "~/components/ui/button";
import { SelectField } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { useVoiceMeter } from "~/features/voz/hooks/use-voice-meter";
import { desktop } from "~/lib/desktop";
import { usePttGlobal } from "~/features/voz/stores/ptt-global";
import {
  SCREEN_FRAME_RATES,
  SCREEN_RESOLUTIONS,
  isScreenFrameRateLocked,
  isScreenResolutionLocked,
  screenQuality,
} from "~/features/voz/lib/qualidade-da-transmissao";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useTranslation } from "~/traducao";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { usePlanLimits, usePlanStore } from "~/features/plan/stores/plan-store";

function keyName(code: string) {
  if (code === "Space") return "Espaço";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Arrow")) return `Seta ${code.slice(5)}`;
  return code;
}

const ShortcutNotice: React.FC = () => {
  const state = usePttGlobal((s) => s.state);
  const key = useVoicePrefs((s) => s.keyPtt);
  const setState = usePttGlobal((s) => s.set);
  const bridge = desktop();

  if (!bridge) {
    return (
      <p data-gc="configuracoes.voice-section.p" className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        No navegador, o push-to-talk só funciona com esta aba em foco. Com o
        jogo em primeiro plano a tecla não chega até aqui — isso o aplicativo
        para computador resolve.
      </p>
    );
  }

  if (state?.needsPermission) {
    return (
      <div data-gc="configuracoes.voice-section.div" className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        <p data-gc="configuracoes.voice-section.p--2">
          Falta liberar o <b data-gc="configuracoes.voice-section.b">{bridge.nameSystem}</b> em{" "}
          <b data-gc="configuracoes.voice-section.b--2">Ajustes do Sistema → Privacidade e Segurança → Acessibilidade</b>.
          Sem isso o macOS não entrega a tecla quando a janela está atrás do
          jogo — e o push-to-talk volta a valer só com o Ravox Chat em foco.
        </p>
        <Button data-gc="configuracoes.voice-section.button"
          className="mt-2"
          variant="surface"
          size="sm"
          onClick={() =>
            void bridge.ptt
              .requestPermission({ active: true, key })
              .then(setState)
          }
        >
          Abrir os ajustes
        </Button>
        <p data-gc="configuracoes.voice-section.p--3" className="mt-2 text-ink-faint">
          Depois de marcar a caixinha, reabra o Ravox Chat.
        </p>
      </div>
    );
  }

  if (state?.unavailable) {
    return (
      <p data-gc="configuracoes.voice-section.p--4" className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        Não consegui ligar o atalho global nesta máquina. O push-to-talk
        continua funcionando com a janela do Ravox Chat em foco.
      </p>
    );
  }

  return (
    <p data-gc="configuracoes.voice-section.p--5" className="mt-3 rounded bg-online/10 px-3 py-2 text-xs text-online">
      No aplicativo a tecla vale mesmo com o jogo em primeiro plano.
    </p>
  );
};

export const VoiceSection: React.FC<{ part?: "audio" | "video" }> = ({
  part = "audio",
}) => {
  const prefs = useVoicePrefs();
  const planLimits = usePlanLimits();
  const openUpgrade = usePlanStore((s) => s.openUpgrade);
  const { t } = useTranslation();
  const applySettings = useVoiceStore((s) => s.applySettings);
  const setScreenQuality = useVoiceStore((s) => s.setScreenQuality);
  const inCall = useVoiceStore((s) => s.channelId !== null);
  const noiseFilterAvailable = useVoiceStore((s) => s.noiseFilterAvailable);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [testing, setTesting] = useState(false);
  const [listeningVoiceOwn, setListeningVoiceOwn] = useState(false);
  const [capturingKey, setCapturingKey] = useState(false);

  const returned = useRef<HTMLAudioElement>(null);

  const measuring =
    testing || (!prefs.sensitivityAutomatic && !inCall) || inCall;
  const { level, isOpen, error, stream } = useVoiceMeter(measuring);

  const listDevices = async () => {
    const list = await navigator.mediaDevices
      .enumerateDevices()
      .catch(() => []);
    setDevices(
      list.filter(
        (d) =>
          d.kind === "audioinput" ||
          d.kind === "audiooutput" ||
          d.kind === "videoinput",
      ),
    );
  };

  useEffect(() => {
    void listDevices();
    navigator.mediaDevices.addEventListener("devicechange", listDevices);
    return () =>
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        listDevices,
      );
  }, []);

  useEffect(() => {
    if (stream || inCall) void listDevices();
  }, [stream, inCall]);

  useEffect(() => {
    const el = returned.current;
    if (!el) return;

    el.srcObject = listeningVoiceOwn ? stream : null;
    if (listeningVoiceOwn && stream) void el.play().catch(() => undefined);
  }, [listeningVoiceOwn, stream]);

  useEffect(() => {
    if (!capturingKey) return;

    const capture = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === "Escape") return setCapturingKey(false);

      void applySettings({ keyPtt: e.code });
      setCapturingKey(false);
    };

    window.addEventListener("keydown", capture, { capture: true });
    return () =>
      window.removeEventListener("keydown", capture, { capture: true });
  }, [capturingKey, applySettings]);

  const withoutNames =
    devices.length > 0 && devices.every((d) => !d.label);
  const entries = devices.filter((d) => d.kind === "audioinput");
  const outputs = devices.filter((d) => d.kind === "audiooutput");
  const cameras = devices.filter((d) => d.kind === "videoinput");
  const outputSupportsSwap = "setSinkId" in HTMLMediaElement.prototype;
  const isMac = desktop()?.platform === "darwin";
  const [seeingPermissions, setSeeingPermissions] = useState(false);

  return (
    <div data-gc="configuracoes.voice-section.div--2" className="max-w-2xl pb-10">
      {isMac && (
        <Button data-gc="configuracoes.voice-section.button--2"
          variant="surface"
          size="sm"
          onClick={() => setSeeingPermissions(true)}
        >
          <ShieldCheck data-gc="configuracoes.voice-section.shield-check" size={14} /> Permissões do macOS
        </Button>
      )}

      {isMac && (
        <MacPermissions data-gc="configuracoes.voice-section.mac-permissions"
          isOpen={seeingPermissions}
          onClose={() => setSeeingPermissions(false)}
        />
      )}

      {part === "audio" && (
        <>
          <Section data-gc="configuracoes.voice-section.section" id="dispositivos" title="Dispositivos">
            <div data-gc="configuracoes.voice-section.div--3" className="grid grid-cols-2 gap-5">
              <label data-gc="configuracoes.voice-section.label" className="block">
                <span data-gc="configuracoes.voice-section.span" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <Mic data-gc="configuracoes.voice-section.mic" size={13} /> Dispositivo de entrada
                </span>
                <SelectField data-gc="configuracoes.voice-section.select-field"
                  value={prefs.entryId ?? ""}
                  onSelect={(id) =>
                    void applySettings({ entryId: id || null })
                  }
                  options={[
                    { value: "", label: "Padrão do sistema" },
                    ...entries.map((d) => ({
                      value: d.deviceId,
                      label: d.label || "Microfone",
                    })),
                  ]}
                />
              </label>

              <label data-gc="configuracoes.voice-section.label--2" className="block">
                <span data-gc="configuracoes.voice-section.span--2" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <Volume2 data-gc="configuracoes.voice-section.volume2" size={13} /> Dispositivo de saída
                </span>
                <SelectField data-gc="configuracoes.voice-section.select-field--2"
                  value={prefs.outputId ?? ""}
                  disabled={!outputSupportsSwap}
                  onSelect={(id) =>
                    void applySettings({ outputId: id || null })
                  }
                  options={[
                    { value: "", label: "Padrão do sistema" },
                    ...outputs.map((d) => ({
                      value: d.deviceId,
                      label: d.label || "Alto-falante",
                    })),
                  ]}
                />
                {!outputSupportsSwap && (
                  <p data-gc="configuracoes.voice-section.p--6" className="mt-1.5 text-xs text-ink-faint">
                    Este navegador não deixa escolher a saída — quem manda é o
                    padrão do sistema.
                  </p>
                )}
              </label>
            </div>
          </Section>

          {withoutNames && (
            <Button data-gc="configuracoes.voice-section.button--3"
              variant="surface"
              size="sm"
              className="mt-3"
              onClick={() =>
                void navigator.mediaDevices
                  .getUserMedia({ audio: true })
                  .then((s) => {
                    s.getTracks().forEach((t) => t.stop());
                    return listDevices();
                  })
                  .catch(() => undefined)
              }
            >
              Mostrar os nomes dos dispositivos
            </Button>
          )}

          <section data-gc="configuracoes.voice-section.section--2" className="mt-7 grid grid-cols-2 gap-5">
            <Control data-gc="configuracoes.voice-section.control"
              title="Volume de entrada"
              display={`${Math.round(prefs.gainEntry * 100)}%`}
              min={0}
              max={2}
              step={0.05}
              value={prefs.gainEntry}
              filled={prefs.gainEntry / 2}
              onChange={(v) => void applySettings({ gainEntry: v })}
            />

            <Control data-gc="configuracoes.voice-section.control--2"
              title="Volume de saída"
              display={`${Math.round(prefs.volumeOutput * 100)}%`}
              min={0}
              max={1}
              step={0.05}
              value={prefs.volumeOutput}
              filled={prefs.volumeOutput}
              onChange={(v) => void applySettings({ volumeOutput: v })}
            />
          </section>

          <Section data-gc="configuracoes.voice-section.section--3" id="teste-do-microfone" title="Teste do microfone">
            <p data-gc="configuracoes.voice-section.p--7" className="mt-1 text-sm text-ink-muted">
              Fale alguma coisa. A barra mostra o que o microfone está captando;
              verde é o que sai daqui, cinza é o que o corte segura.
            </p>

            <div data-gc="configuracoes.voice-section.div--4" className="mt-3 flex items-center gap-3">
              <Button data-gc="configuracoes.voice-section.button--4"
                variant="surface"
                size="sm"
                onClick={() => setTesting((v) => !v)}
              >
                {testing ? "Parar o teste" : "Vamos verificar"}
              </Button>

              {testing && !inCall && (
                <label data-gc="configuracoes.voice-section.label--3" className="flex items-center gap-2 text-sm text-ink-muted">
                  <Switch data-gc="configuracoes.voice-section.switch.set-listening-voice-own"
                    checked={listeningVoiceOwn}
                    onCheckedChange={setListeningVoiceOwn}
                  />
                  Ouvir minha voz
                </label>
              )}

              {inCall && (
                <span data-gc="configuracoes.voice-section.span--3" className="text-xs text-ink-faint">
                  Lendo da chamada em andamento.
                </span>
              )}
            </div>

            <Meter data-gc="configuracoes.voice-section.meter" level={level} isOpen={isOpen} className="mt-3" />
            {error && <p data-gc="configuracoes.voice-section.p--8" className="mt-2 text-xs text-danger">{error}</p>}

            <audio data-gc="configuracoes.voice-section.audio" ref={returned} autoPlay />
          </Section>

          <Section data-gc="configuracoes.voice-section.section--4" id="modo-de-entrada" title="Modo de entrada">
            <div data-gc="configuracoes.voice-section.div--5"
              role="radiogroup"
              aria-labelledby="modo-de-entrada"
              className="mt-3 grid grid-cols-2 gap-3"
            >
              <Choice data-gc="configuracoes.voice-section.choice"
                active={prefs.mode === "voz"}
                icon={AudioLines}
                title="Atividade de voz"
                description="Transmite quando você fala."
                onClick={() => void applySettings({ mode: "voz" })}
                onIrForOther={() => void applySettings({ mode: "ptt" })}
              />
              <Choice data-gc="configuracoes.voice-section.choice--2"
                active={prefs.mode === "ptt"}
                icon={Keyboard}
                title="Push-to-talk"
                description="Transmite só com a tecla pressionada."
                onClick={() => void applySettings({ mode: "ptt" })}
                onIrForOther={() => void applySettings({ mode: "voz" })}
              />
            </div>

            {prefs.mode === "ptt" && (
              <div data-gc="configuracoes.voice-section.div--6" className="mt-4">
                <p data-gc="configuracoes.voice-section.p--9" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Atalho
                </p>

                <Button data-gc="configuracoes.voice-section.button--5"
                  variant={capturingKey ? "primary" : "surface"}
                  size="sm"
                  onClick={() => setCapturingKey(true)}
                >
                  <Keyboard data-gc="configuracoes.voice-section.keyboard" size={14} />
                  {capturingKey
                    ? "Aperte uma tecla…"
                    : keyName(prefs.keyPtt)}
                </Button>

                <ShortcutNotice data-gc="configuracoes.voice-section.shortcut-notice" />
              </div>
            )}
          </Section>

          <Section data-gc="configuracoes.voice-section.section--5" id="sensibilidade" title="Sensibilidade de entrada">
            <div data-gc="configuracoes.voice-section.div--7" className="mt-3 flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--8" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--10" className="text-sm font-medium">
                  Determinar automaticamente
                </p>
                <p data-gc="configuracoes.voice-section.p--11" className="mt-0.5 text-xs text-ink-faint">
                  O corte se ajusta sozinho ao barulho do ambiente.
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch"
                checked={prefs.sensitivityAutomatic}
                onCheckedChange={(v) =>
                  void applySettings({ sensitivityAutomatic: v })
                }
              />
            </div>

            {!prefs.sensitivityAutomatic && (
              <div data-gc="configuracoes.voice-section.div--9" className="mt-4">
                <Meter data-gc="configuracoes.voice-section.meter--2" level={level} isOpen={isOpen} threshold={prefs.threshold} />
                <Slider data-gc="configuracoes.voice-section.slider"
                  className="mt-2"
                  min={0}
                  max={0.5}
                  step={0.005}
                  value={prefs.threshold}
                  filled={prefs.threshold / 0.5}
                  onChange={(e) =>
                    void applySettings({ threshold: Number(e.target.value) })
                  }
                />
                <p data-gc="configuracoes.voice-section.p--12" className="mt-2 text-xs text-ink-faint">
                  Coloque a marca logo acima do barulho de fundo: o que passar
                  dela é transmitido.
                </p>
              </div>
            )}
          </Section>

          <Section data-gc="configuracoes.voice-section.section--6" id="qualidade" title="Qualidade">
            <div data-gc="configuracoes.voice-section.div--10" className="mt-3 flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--11" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--13" className="text-sm font-medium">
                  Supressão de ruído avançada
                </p>
                <p data-gc="configuracoes.voice-section.p--14" className="mt-0.5 text-xs text-ink-faint">
                  {noiseFilterAvailable
                    ? "Remove ventilador, teclado, conversa ao fundo e obra na rua. DeepFilterNet, rodando aqui no seu aparelho."
                    : "Indisponível neste navegador — segue valendo a supressão do próprio navegador."}
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch--2"
                checked={prefs.noiseSuppression && noiseFilterAvailable}
                disabled={!noiseFilterAvailable}
                onCheckedChange={(v) =>
                  void applySettings({ noiseSuppression: v })
                }
              />
            </div>

            <div data-gc="configuracoes.voice-section.div--12" className="mt-4 flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--13" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--15" className="text-sm font-medium">Sons da interface</p>
                <p data-gc="configuracoes.voice-section.p--16" className="mt-0.5 text-xs text-ink-faint">
                  Bipes curtos ao entrar e sair da chamada, mutar e começar a
                  transmitir. Quem está gravando ou transmitindo costuma
                  preferir desligado.
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch--3"
                checked={prefs.interfaceSound}
                onCheckedChange={(v) => prefs.set({ interfaceSound: v })}
              />
            </div>
          </Section>
        </>
      )}

      {part === "video" && (
        <>
          <Section data-gc="configuracoes.voice-section.section--7"
            id="video"
            title="Vídeo"
            detail="A câmera que entra quando você liga o vídeo numa chamada."
          >
            <label data-gc="configuracoes.voice-section.label--4" className="block max-w-sm">
              <span data-gc="configuracoes.voice-section.span--4" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Video data-gc="configuracoes.voice-section.video" size={13} /> Câmera
              </span>
              <SelectField data-gc="configuracoes.voice-section.select-field--3"
                value={prefs.cameraId ?? ""}
                onSelect={(id) => prefs.set({ cameraId: id || null })}
                options={[
                  { value: "", label: "Padrão do sistema" },
                  ...cameras.map((d) => ({
                    value: d.deviceId,
                    label: d.label || "Câmera",
                  })),
                ]}
              />
            </label>

            {!cameras.length && (
              <p data-gc="configuracoes.voice-section.p--17" className="mt-2 text-xs text-ink-faint">
                Nenhuma câmera encontrada. Os nomes só aparecem depois que você
                der permissão de vídeo ao Ravox Chat uma vez.
              </p>
            )}
          </Section>

          <Section data-gc="configuracoes.voice-section.section--8" id="transmissao" title="Transmissão">
            <div data-gc="configuracoes.voice-section.div--14" className="flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--15" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--18" className="text-sm font-medium">
                  Compartilhar o som do sistema
                </p>
                <p data-gc="configuracoes.voice-section.p--19" className="mt-0.5 text-xs text-ink-faint">
                  Manda o áudio do computador junto com a tela — é o que faz
                  assistir vídeo em conjunto funcionar.{" "}
                  <strong data-gc="configuracoes.voice-section.strong" className="text-ink">
                    Se você ouve a chamada pelas caixas
                  </strong>
                  , o que sai delas é capturado e volta pra sala: todo mundo se
                  escuta em eco. De fone, não acontece.
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch--4"
                checked={prefs.screenSound}
                onCheckedChange={(v) => prefs.set({ screenSound: v })}
              />
            </div>

            <div data-gc="configuracoes.voice-section.div--16" className="mt-5 grid max-w-md grid-cols-2 gap-3">
              <label data-gc="configuracoes.voice-section.label--5" className="block">
                <span data-gc="configuracoes.voice-section.span--5" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t("chamada.tela.resolucao")}
                </span>
                <SelectField data-gc="configuracoes.voice-section.select-field--4"
                  value={screenQuality(prefs.screenResolution, prefs.screenFrameRate, planLimits).resolution}
                  onSelect={(value) => void setScreenQuality({ screenResolution: value })}
                  options={SCREEN_RESOLUTIONS.map((value) => ({
                    value,
                    label: value === "original" ? t("chamada.tela.original") : `${value}p`,
                    disabled: isScreenResolutionLocked(value, planLimits),
                  }))}
                />
              </label>

              <label data-gc="configuracoes.voice-section.label--6" className="block">
                <span data-gc="configuracoes.voice-section.span--6" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t("chamada.tela.taxaDeQuadros")}
                </span>
                <SelectField data-gc="configuracoes.voice-section.select-field--5"
                  value={screenQuality(prefs.screenResolution, prefs.screenFrameRate, planLimits).frameRate}
                  onSelect={(value) => void setScreenQuality({ screenFrameRate: value })}
                  options={SCREEN_FRAME_RATES.map((value) => ({
                    value,
                    label: t("chamada.tela.quadros", { quadros: value }),
                    disabled: isScreenFrameRateLocked(value, planLimits),
                  }))}
                />
              </label>
            </div>
            {planLimits.screenResolutions.length < SCREEN_RESOLUTIONS.length && (
              <button data-gc="configuracoes.voice-section.button--6"
                type="button"
                onClick={() => openUpgrade()}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
              >
                <InfinityIcon data-gc="configuracoes.voice-section.infinity-icon" size={13} /> {t("configuracoes.subscription.screenUpsell")}
              </button>
            )}
            <p data-gc="configuracoes.voice-section.p--20" className="mt-2 max-w-md text-xs text-ink-faint">
              {t("chamada.tela.qualidadeDica")}
            </p>
          </Section>
        </>
      )}
    </div>
  );
};

interface MeterProps {
  level: number;
  isOpen: boolean;
  threshold?: number;
  className?: string;
}

const Meter: React.FC<MeterProps> = ({
  level,
  isOpen,
  threshold,
  className,
}) => (
  <div data-gc="configuracoes.voice-section.div--17"
    className={cn(
      "relative h-2.5 w-full overflow-hidden rounded-full bg-surface-0",
      className,
    )}
  >
    <div data-gc="configuracoes.voice-section.div--18"
      className={cn(
        "h-full rounded-full transition-[width] duration-75",
        isOpen ? "bg-online" : "bg-surface-4",
      )}
      style={{ width: `${Math.min(100, level * 100)}%` }}
    />

    {threshold !== undefined && (
      <span data-gc="configuracoes.voice-section.span--7"
        className="absolute top-0 h-full w-0.5 bg-ink"
        style={{ left: `${Math.min(100, threshold * 100)}%` }}
      />
    )}
  </div>
);

interface ControlProps {
  title: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  filled: number;
  onChange: (value: number) => void;
}

const Control: React.FC<ControlProps> = ({
  title,
  value,
  onChange,
  filled,
  ...props
}) => (
  <label data-gc="configuracoes.voice-section.label--7" className="block">
    <span data-gc="configuracoes.voice-section.span--8" className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {title} <span data-gc="configuracoes.voice-section.span--9" className="text-ink-faint">{value}</span>
    </span>
    <Slider data-gc="configuracoes.voice-section.slider--2"
      {...props}
      filled={filled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

interface OptionProps {
  active: boolean;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  onIrForOther: () => void;
}

const Choice: React.FC<OptionProps> = ({
  active,
  icon: Icon,
  title,
  description,
  onClick,
  onIrForOther,
}) => (
  <button data-gc="configuracoes.voice-section.button.on-click"
    role="radio"
    data-state={active ? "checked" : "unchecked"}
    aria-checked={active}
    tabIndex={active ? 0 : -1}
    onClick={onClick}
    onKeyDown={(e) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
        return;

      e.preventDefault();
      onIrForOther();
    }}
    className={cn(
      radioOptionClass(),
      "flex items-start gap-3 rounded-lg border p-3 text-left transition",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel",
      active
        ? "border-brand bg-brand/10"
        : "border-line hover:border-ink-faint hover:bg-surface-3",
    )}
  >
    <Icon data-gc="configuracoes.voice-section.icon"
      size={18}
      className={cn(
        "mt-px shrink-0 transition",
        active ? "text-brand" : "text-ink-faint",
      )}
    />

    <span data-gc="configuracoes.voice-section.span--10" className="min-w-0 flex-1">
      <span data-gc="configuracoes.voice-section.span--11" className="block text-sm font-medium">{title}</span>
      <span data-gc="configuracoes.voice-section.span--12" className="mt-0.5 block text-xs text-ink-faint">{description}</span>
    </span>

    <span data-gc="configuracoes.voice-section.span--13"
      aria-hidden
      className={cn(
        "relative mt-px size-4 shrink-0 rounded-full border transition",
        active ? "border-brand" : "border-surface-4",
      )}
    >
      {active && <span data-gc="configuracoes.voice-section.span--14" className="absolute inset-[3px] rounded-full bg-brand" />}
    </span>
  </button>
);

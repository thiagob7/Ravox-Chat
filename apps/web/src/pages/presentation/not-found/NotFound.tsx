import React from "react";
import { useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { LottieArt } from "~/components/LottieArt";
import { useTranslation } from "~/traducao";

const loadArt = () => import("~/assets/animations/not-found.json").then((mod) => mod.default);

export const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div data-gc="not-found.not-found.div" className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface-0 px-6 py-12 text-center">
      <LottieArt data-gc="not-found.not-found.lottie-art" name="not-found" load={loadArt} label={t("comum.perdido.titulo")} className="w-full max-w-xl" />

      <div data-gc="not-found.not-found.div--2" className="max-w-md">
        <h1 data-gc="not-found.not-found.h1" className="text-2xl font-semibold">{t("comum.perdido.titulo")}</h1>
        <p data-gc="not-found.not-found.p" className="mt-2 text-sm text-ink-muted">{t("comum.perdido.detalhe")}</p>
      </div>

      <Button data-gc="not-found.not-found.button" className="min-w-44" onClick={() => navigate("/channels", { replace: true })}>
        {t("comum.voltar")}
      </Button>
    </div>
  );
};

export default NotFound;

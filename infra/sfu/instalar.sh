#!/usr/bin/env bash
# Instala o agente de metricas na VM do SFU e ensina o Caddy a servi-lo.
#
# Idempotente: rodar de novo reaproveita o token que ja existe la, entao o .env
# da API nao precisa ser mexido a cada instalacao.
set -euo pipefail

HOST="${HOST:-ubuntu@129.148.39.110}"
CHAVE="${CHAVE:-$HOME/oracle-a1/ssh-key-2026-08-26.key}"
SSH="ssh -i $CHAVE -o BatchMode=yes"
AQUI="$(cd "$(dirname "$0")" && pwd)"

[ -f "$CHAVE" ] || { echo "chave nao encontrada: $CHAVE"; exit 1; }

echo "==> token"
# Reaproveita o que ja esta la. Gerar um novo a cada execucao quebraria a API
# em silencio: ela continuaria pedindo com o token velho e levando 404.
TOKEN=$($SSH "$HOST" "sudo sed -n 's/^GRAVAE_MAQUINA_TOKEN=//p' /etc/gravae/maquina.env 2>/dev/null" || true)
if [ -z "$TOKEN" ]; then
  TOKEN=$(openssl rand -hex 32)
  echo "    token novo gerado"
else
  echo "    reaproveitando o token que ja estava na VM"
fi

echo "==> enviando arquivos"
$SSH "$HOST" "mkdir -p /tmp/gravae-maquina"
scp -q -i "$CHAVE" \
  "$AQUI/gravae-maquina" \
  "$AQUI/gravae-maquina.socket" \
  "$AQUI/gravae-maquina@.service" \
  "$AQUI/Caddyfile" \
  "$HOST:/tmp/gravae-maquina/"

echo "==> instalando"
$SSH "$HOST" "sudo bash -s" <<INSTALA
set -euo pipefail
cd /tmp/gravae-maquina

command -v jq >/dev/null || DEBIAN_FRONTEND=noninteractive apt-get install -y -qq jq >/dev/null

install -m 0755 gravae-maquina /usr/local/bin/gravae-maquina
install -m 0644 gravae-maquina.socket /etc/systemd/system/
install -m 0644 'gravae-maquina@.service' /etc/systemd/system/

install -d -m 0750 /etc/gravae
# 0600 root:root: o systemd le este arquivo como root e so depois desce pro
# usuario dinamico, entao ninguem alem do root precisa conseguir abrir.
umask 077
printf 'GRAVAE_MAQUINA_TOKEN=%s\n' '$TOKEN' > /etc/gravae/maquina.env
chmod 0600 /etc/gravae/maquina.env

systemctl daemon-reload
systemctl enable --now gravae-maquina.socket

# Valida o candidato AINDA no /tmp, antes de encostar no que esta em producao.
# Um Caddyfile quebrado nesta VM nao derruba so as metricas: derruba junto a
# sinalizacao do LiveKit, e ai as chamadas param. Validar depois de instalar
# deixaria o arquivo ruim no lugar esperando o proximo restart do Caddy.
caddy validate --config Caddyfile --adapter caddyfile >/dev/null

if [ -f /etc/caddy/Caddyfile ] && ! cmp -s Caddyfile /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-\$(date +%Y%m%d-%H%M%S)"
fi
install -m 0644 Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy

rm -rf /tmp/gravae-maquina
INSTALA

echo "==> teste local na VM do SFU"
$SSH "$HOST" "curl -sS --max-time 5 -H 'Authorization: Bearer $TOKEN' http://127.0.0.1:9101/interno/maquina" \
  | python3 -m json.tool || { echo "    o agente nao respondeu JSON valido"; exit 1; }

echo
echo "pronto. Ponha estas duas linhas no .env da API (raiz do repo) e rode o deploy-api.sh:"
echo
echo "SFU_STATUS_URL=https://ravoxchat-sfu.duckdns.org/interno/maquina"
echo "SFU_STATUS_TOKEN=$TOKEN"

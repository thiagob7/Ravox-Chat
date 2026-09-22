# A API de staging

Uma segunda API na **mesma VM** da de produção, na porta 3334, para o `staging`
ser testado de verdade — front e servidor — antes de qualquer coisa ir ao ar.

## Por que na mesma máquina

Medido em 08/09/2026: a VM tem 954 MB, a API de produção usa 136 e sobram 471
livres. A segunda cabe com folga, e ela fica parada quase o tempo todo. O
`MemoryMax=300M` da unidade existe para que, se um dia ela enlouquecer, morra
sozinha em vez de levar a de produção junto.

## O que é separado, e por quê

| | Produção | Staging |
|---|---|---|
| Porta | 3333 | 3334 |
| Banco | `gravae` | `gravae-staging` (mesmo cluster) |
| Redis | índice 0 | índice 1 |
| Pasta no R2 | `gravae-chat/` | `gravae-chat-staging/` |
| Segredos | os de sempre | **outros** |

Os segredos precisam ser outros. Com o mesmo `JWT_SECRET`, um token emitido em
staging valeria em produção — e staging é onde se testa coisa quebrada.

O banco é outro **nome** no mesmo cluster do Atlas. Cluster novo custaria; nome
novo não custa nada. A conta dos 512 MB é somada entre os dois, então dado de
teste que não serve mais deve ser apagado.

## Instalar

```bash
bash infra/staging/instalar.sh
```

Ele instala a unidade do systemd e reescreve o Caddyfile — que é **o mesmo
arquivo da produção**. Por isso valida antes de encostar e guarda uma cópia do
anterior: um Caddyfile quebrado aqui derruba a API de verdade junto.

Na primeira vez ele para e pede o `.env`, que não é criado por script porque
carrega segredo. As linhas a trocar estão impressas na tela.

## Publicar

```bash
bash infra/staging/publicar.sh
```

Publica **a branch que estiver aberta**. É o passo do meio: `dev` → `staging`
aqui → só depois `master` e o `deploy-api.sh` de produção.

## Falta fora daqui

- **O subdomínio** `ravoxchat-api-staging.duckdns.org`, apontando para o mesmo
  IP. É criado na conta do DuckDNS, que tem teto de 5 subdomínios. O antigo,
  `gravaechat-api-staging`, foi apagado em 22/09/2026. O `gravaechat-api` responde
  num bloco próprio do Caddy, com log em `/var/log/caddy/gravaechat-api.log`, para
  ver quem ainda usa o nome antigo antes de apagá-lo.
- **O endereço do front** de staging na Vercel, que vai no `WEB_ORIGIN`.

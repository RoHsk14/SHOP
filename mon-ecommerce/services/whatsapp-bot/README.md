# WhatsApp Bot multi-tenant

Chaque boutique (`shop_slug`) a sa **propre session** WhatsApp : QR code, numéro, groupes et polling Google Sheet isolés.

## Architecture

```
Admin boutique A  →  /api/whatsapp/A/status  →  Client A + session-A
Admin boutique B  →  /api/whatsapp/B/status  →  Client B + session-B
```

| Composant | Rôle |
|-----------|------|
| `server.js` | SessionManager (`Map`), routes `/:shopSlug/*`, poll par shop |
| LocalAuth | Dossier `{WWEBJS_AUTH_PATH}/session-{shopSlug}` |
| `whatsapp_sessions` | Statut / téléphone en base (sync) |
| `settings` | `whatsapp_enabled`, `whatsapp_group_id`, `google_sheet_url` |

## Démarrage

### Dev (monté dans Next via `mon-ecommerce/server.js`)

```bash
cd mon-ecommerce
node server.js
# Bot accessible sur http://localhost:3000/api/whatsapp/:shopSlug/status
```

### Standalone (Docker / Render)

```bash
cd services/whatsapp-bot
cp .env.example .env   # remplir les clés
npm start
# http://localhost:3001/:shopSlug/status
```

Variables importantes :

| Variable | Description |
|----------|-------------|
| `PORT` | Port HTTP (défaut `3001`) |
| `WWEBJS_AUTH_PATH` | Racine des sessions LocalAuth (défaut `~/.wwebjs_auth`) |
| `MAX_WA_SESSIONS` | Plafond Chrome simultanés (défaut `20`) |
| `WHATSAPP_BOT_SECRET` | Secret partagé app ↔ bot (`X-Bot-Secret`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Lecture settings + upsert sessions |
| `GOOGLE_SERVICE_ACCOUNT_KEY` ou `_PATH` | Accès Sheets |
| `NHOST_AUTH_URL` ou `NEXT_PUBLIC_NHOST_SUBDOMAIN` | Vérif JWT owner |
| `CHROME_PATH` / `PUPPETEER_EXECUTABLE_PATH` | Binaire Chrome |

Côté app Next (prod bot séparé) :

```
WHATSAPP_BOT_URL=https://your-bot.example.com
WHATSAPP_BOT_SECRET=same-as-bot
```

## API (par boutique)

Toutes les routes (sauf `/health`) exigent :

- `Authorization: Bearer <nhost_access_token>` **et** ownership de la boutique  
  **ou**
- `X-Bot-Secret: <WHATSAPP_BOT_SECRET>` (proxy interne)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/health` | Santé + liste sessions actives |
| GET | `/:shopSlug/status` | Statut ; auto-start si session disque existante |
| POST | `/:shopSlug/connect` | Démarre une session (lazy) |
| GET | `/:shopSlug/qr-image` | PNG du QR |
| POST | `/:shopSlug/pairing` | Body `{ "phone": "229..." }` |
| POST | `/:shopSlug/reset` | Destroy + wipe auth + nouveau QR |
| POST | `/:shopSlug/disconnect` | Body optionnel `{ "wipe": true }` |
| GET | `/:shopSlug/groups` | Groupes WA du numéro de **cette** boutique |

Via Next (recommandé UI) :

```
/api/whatsapp/{shopSlug}/status
/api/whatsapp/{shopSlug}/qr-image
...
```

## Cycle de vie d’une session

1. Marchand ouvre Admin → WhatsApp → **Connecter mon WhatsApp**
2. Bot crée `Client` + `LocalAuth({ clientId: shopSlug })`
3. Event `qr` → UI affiche le QR (blob authentifié)
4. Event `ready` → statut `connected`, poll sheet toutes les 30 s
5. Reset → `destroy` + suppression dossier `session-{slug}` + re-init

Au boot : restauration auto des boutiques `whatsapp_enabled = true` qui ont encore un dossier auth (dans la limite `MAX_WA_SESSIONS`).

## Isolation

- QR / reset d’une boutique **n’affecte pas** les autres
- Polling : uniquement le sheet + groupe de **ce** `shop_slug`
- Auth : owner (`settings.user_id`) ou super-admin

## Base de données

Exécuter une fois :

```bash
# fichier à la racine mon-ecommerce
psql $DATABASE_URL -f supabase-whatsapp-sessions.sql
```

Ou via `scripts/seed.ts` (crée la table si absente).

## Ops / échelle (5–30 boutiques)

- ~300–500 Mo RAM par Chrome → viser **8–16 Go** pour ~15–20 sessions
- Monter un **volume** sur `/data` (Docker) pour ne pas re-scanner le QR à chaque deploy
- Une seule instance bot (sessions mémoire + disque local) — pas de multi-replicas sticky-free
- Si la limite est atteinte : HTTP 503 + message clair

## Migration depuis l’ancien bot mono-session

1. Déployer ce code + créer `whatsapp_sessions`
2. Ancienne session globale `~/.wwebjs_auth/session` n’est **plus** utilisée
3. Chaque boutique doit rescanner son propre QR
4. Retirer l’ancien allowlist UI (déjà fait)

## Dépannage

| Symptôme | Piste |
|----------|--------|
| 401 Non authentifié | Token Bearer manquant / expiré |
| 403 Accès refusé | `settings.user_id` ≠ user connecté |
| 503 Limite sessions | Augmenter `MAX_WA_SESSIONS` ou RAM |
| QR ne s’affiche pas | Attendre `awaiting_scan` + auth sur `/qr-image` |
| Reset ramène l’ancien numéro | Vérifier que le wipe du dossier `session-{slug}` fonctionne (droits FS) |

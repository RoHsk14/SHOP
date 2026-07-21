# WhatsApp multi-tenant — guide

## Objectif

Chaque boutique a **son propre espace WhatsApp** :

- son QR code
- son numéro
- ses groupes
- ses notifications (Google Sheet → groupe)

Le reset / déconnexion d’une boutique **n’impacte pas** les autres.

---

## Ce qui a changé

| Avant | Après |
|-------|--------|
| 1 session globale | 1 session par `shop_slug` |
| 1 QR pour toute la plateforme | QR isolé par boutique |
| Poll de tous les shops via 1 numéro | Poll par shop via **son** client |
| UI bloquée à 1 UUID | Tous les owners de boutique |
| APIs `/status` sans auth | `/:shopSlug/*` + Bearer (owner) |

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `services/whatsapp-bot/server.js` | SessionManager multi-tenant |
| `services/whatsapp-bot/README.md` | Doc ops bot |
| `src/app/api/whatsapp/[...action]/route.ts` | Proxy prod + auth ownership |
| `src/app/boutiques/[subdomain]/admin/whatsapp/page.tsx` | UI admin |
| `supabase-whatsapp-sessions.sql` | Migration table sessions |
| `Dockerfile` | Bot standalone + volume `/data` |

---

## Setup rapide

### 1. Base de données

```bash
psql "$DATABASE_URL" -f mon-ecommerce/supabase-whatsapp-sessions.sql
```

### 2. Variables d’environnement

**Bot** (`services/whatsapp-bot/.env`) :

```env
PORT=3001
MAX_WA_SESSIONS=20
WWEBJS_AUTH_PATH=/data/wwebjs_auth
WHATSAPP_BOT_SECRET=<secret-partage>
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_NHOST_SUBDOMAIN=...
NEXT_PUBLIC_NHOST_REGION=eu-central-1
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=...
```

**App Next** (prod, bot séparé) :

```env
WHATSAPP_BOT_URL=https://votre-bot.render.com
WHATSAPP_BOT_SECRET=<meme-secret>
```

### 3. Lancer

**Dev** (bot monté dans Express) :

```bash
cd mon-ecommerce && node server.js
```

**Prod bot** :

```bash
node services/whatsapp-bot/server.js
# ou Docker avec volume sur /data
```

### 4. Utilisation marchand

1. Admin boutique → **WhatsApp**
2. **Connecter mon WhatsApp**
3. Scanner le QR (Appareils connectés)
4. Choisir le groupe de notif
5. Activer les notifications + Enregistrer

---

## API (résumé)

```
GET  /api/whatsapp/{shop}/status
POST /api/whatsapp/{shop}/connect
GET  /api/whatsapp/{shop}/qr-image
POST /api/whatsapp/{shop}/pairing   { "phone": "229..." }
POST /api/whatsapp/{shop}/reset
GET  /api/whatsapp/{shop}/groups
```

Header requis : `Authorization: Bearer <access_token>`  
Le token doit appartenir au `user_id` owner de la boutique (ou super-admin).

---

## Limites & bonnes pratiques

- **RAM** : ~300–500 Mo par session Chrome → machine 8–16 Go pour 15–20 boutiques
- **`MAX_WA_SESSIONS`** : plafond (défaut 20) ; au-delà → 503
- **Volume disque** : persister `WWEBJS_AUTH_PATH` sinon re-scan QR à chaque deploy
- **1 instance bot** : pas de multi-replicas sans sticky sessions
- **WhatsApp ToS** : un numéro personnel par boutique ; usage raisonnable

---

## Dépannage

| Problème | Action |
|----------|--------|
| « Fonctionnalité en développement » | Ancienne UI — hard refresh / redéployer |
| 401 | Se reconnecter (token expiré) |
| 403 | Vérifier `settings.user_id` de la boutique |
| Service indisponible | Bot down ou `WHATSAPP_BOT_URL` faux |
| Limite sessions | Augmenter `MAX_WA_SESSIONS` / RAM |
| Mauvais numéro après reset | Vérifier droits d’écriture sur `WWEBJS_AUTH_PATH` |

Doc détaillée bot : [`services/whatsapp-bot/README.md`](./services/whatsapp-bot/README.md)

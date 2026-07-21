const path = require('path');
const fs = require('fs');
const os = require('os');

// Load env: parent app first (.env.local has Nhost), then bot .env (overrides)
const dotenv = require('dotenv');
const appRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(appRoot, '.env') });
dotenv.config({ path: path.join(appRoot, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const { google } = require('googleapis');

const PORT = process.env.PORT || 3001;
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL_MS) || 30000;
const MAX_WA_SESSIONS = Number(process.env.MAX_WA_SESSIONS) || 20;
const AUTH_ROOT = process.env.WWEBJS_AUTH_PATH || path.join(os.homedir(), '.wwebjs_auth');
const CACHE_PATH = path.join(__dirname, '.wwebjs_cache');
const BOT_SECRET = process.env.WHATSAPP_BOT_SECRET || process.env.BOT_INTERNAL_SECRET || '';
const SA_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json';

function getNhostConfig() {
  const sub = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '';
  const region = process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || 'eu-central-1';
  const adminSecret = process.env.NHOST_ADMIN_SECRET || '';
  return { sub, region, adminSecret };
}

function getNhostAuthBases() {
  const bases = [];
  const explicit = process.env.NHOST_AUTH_URL || '';
  if (explicit) bases.push(explicit.replace(/\/$/, ''));
  const { sub, region } = getNhostConfig();
  if (sub) bases.push(`https://${sub}.auth.${region}.nhost.run/v1`);
  return bases;
}

function getNhostGraphqlUrl() {
  const explicit = process.env.NHOST_GRAPHQL_URL || '';
  if (explicit) return explicit.replace(/\/$/, '');
  const { sub, region } = getNhostConfig();
  if (!sub) return '';
  return `https://${sub}.graphql.${region}.nhost.run/v1`;
}

/** GraphQL helper (Hasura / Nhost) — source de vérité des settings */
async function gql(query, variables = {}) {
  const url = getNhostGraphqlUrl();
  const { adminSecret } = getNhostConfig();
  if (!url) throw new Error('Nhost GraphQL non configure (NEXT_PUBLIC_NHOST_SUBDOMAIN)');
  if (!adminSecret) throw new Error('NHOST_ADMIN_SECRET manquant');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': adminSecret,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GraphQL HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  }
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

async function fetchShopSettings(shopSlug) {
  const data = await gql(
    `query ShopSettings($slug: String!) {
      settings(where: { shop_slug: { _eq: $slug } }, limit: 1) {
        shop_slug
        shop_name
        user_id
        is_super_admin
        google_sheet_url
        whatsapp_group_id
        whatsapp_enabled
      }
    }`,
    { slug: shopSlug }
  );
  const rows = data && data.settings;
  return rows && rows.length ? rows[0] : null;
}

async function fetchEnabledWhatsappShops() {
  const data = await gql(
    `query EnabledWaShops {
      settings(where: { whatsapp_enabled: { _eq: true } }) {
        shop_slug
      }
    }`
  );
  return (data && data.settings) || [];
}

async function isUserSuperAdmin(userId) {
  const data = await gql(
    `query SuperAdmin($uid: uuid!) {
      settings(where: { user_id: { _eq: $uid }, is_super_admin: { _eq: true } }, limit: 1) {
        id
      }
    }`,
    { uid: userId }
  );
  const rows = data && data.settings;
  return !!(rows && rows.length);
}

/** @type {Map<string, SessionEntry>} */
const sessions = new Map();

/**
 * @typedef {object} SessionEntry
 * @property {import('whatsapp-web.js').Client|null} client
 * @property {string} status
 * @property {string|null} qrCodeData
 * @property {string|null} pairingCodeData
 * @property {string|null} phoneNumber
 * @property {ReturnType<typeof setInterval>|null} pollTimer
 * @property {boolean} starting
 * @property {number} lastActivity
 * @property {{id:string,name:string}[]} groupsCache
 * @property {number} groupsCachedAt
 * @property {boolean} groupsLoading
 */

function ensureAuthRoot() {
  try {
    fs.mkdirSync(AUTH_ROOT, { recursive: true });
  } catch (e) {
    console.error('[auth] mkdir failed:', e.message);
  }
}

function sanitizeSlug(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const slug = raw.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(slug)) return null;
  return slug;
}

function getSession(shopSlug) {
  return sessions.get(shopSlug) || null;
}

function ensureSessionEntry(shopSlug) {
  let entry = sessions.get(shopSlug);
  if (!entry) {
    entry = {
      client: null,
      status: 'disconnected',
      qrCodeData: null,
      pairingCodeData: null,
      phoneNumber: null,
      pollTimer: null,
      starting: false,
      lastActivity: Date.now(),
      groupsCache: [],
      groupsCachedAt: 0,
      groupsLoading: false,
    };
    sessions.set(shopSlug, entry);
  }
  entry.lastActivity = Date.now();
  if (!Array.isArray(entry.groupsCache)) entry.groupsCache = [];
  if (entry.groupsCachedAt == null) entry.groupsCachedAt = 0;
  if (entry.groupsLoading == null) entry.groupsLoading = false;
  return entry;
}

function countActiveClients() {
  let n = 0;
  for (const entry of sessions.values()) {
    if (entry.client || entry.starting) n += 1;
  }
  return n;
}

function puppeteerOptions() {
  const executablePath =
    process.env.CHROME_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    undefined;
  return {
    headless: true,
    executablePath,
    protocolTimeout: 300000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-gl-drawing-for-tests',
    ],
  };
}

function getGoogleAuth() {
  try {
    let credentials;
    const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (envKey) {
      credentials = JSON.parse(envKey);
    } else {
      const filePath = path.resolve(SA_KEY_PATH);
      credentials = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } catch (e) {
    console.error('Google Auth init error:', e.message);
    return null;
  }
}

function extractSheetId(url) {
  if (!url) return null;
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return null;
  const id = m[1];
  if (!/^[a-zA-Z0-9_-]{30,}$/.test(id)) return null;
  return id;
}

async function syncSessionDb(shopSlug, fields) {
  // Optional table — ignore if not tracked in Hasura yet
  try {
    const { adminSecret } = getNhostConfig();
    if (!adminSecret || !getNhostGraphqlUrl()) return;

    const status = fields.status != null ? fields.status : null;
    const phone = fields.phone_number !== undefined ? fields.phone_number : null;
    const lastQr = fields.last_qr_at !== undefined ? fields.last_qr_at : null;
    const connectedAt = fields.connected_at !== undefined ? fields.connected_at : null;
    const updatedAt = new Date().toISOString();

    await gql(
      `mutation UpsertWaSession(
        $shop_slug: String!
        $status: String
        $phone_number: String
        $last_qr_at: timestamptz
        $connected_at: timestamptz
        $updated_at: timestamptz
      ) {
        insert_whatsapp_sessions_one(
          object: {
            shop_slug: $shop_slug
            status: $status
            phone_number: $phone_number
            last_qr_at: $last_qr_at
            connected_at: $connected_at
            updated_at: $updated_at
          }
          on_conflict: {
            constraint: whatsapp_sessions_pkey
            update_columns: [status, phone_number, last_qr_at, connected_at, updated_at]
          }
        ) { shop_slug }
      }`,
      {
        shop_slug: shopSlug,
        status,
        phone_number: phone,
        last_qr_at: lastQr,
        connected_at: connectedAt,
        updated_at: updatedAt,
      }
    );
  } catch (e) {
    // Table may not exist yet — non-blocking
    if (!/whatsapp_sessions|field|table/i.test(e.message)) {
      console.error(`[${shopSlug}] DB sync:`, e.message);
    }
  }
}

function sessionDir(shopSlug) {
  return path.join(AUTH_ROOT, `session-${shopSlug}`);
}

function wipeAuthFiles(shopSlug) {
  const dir = sessionDir(shopSlug);
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`[${shopSlug}] Auth folder wiped`);
    }
  } catch (e) {
    console.error(`[${shopSlug}] Wipe auth failed:`, e.message);
  }
}

function stopPolling(shopSlug) {
  const entry = getSession(shopSlug);
  if (!entry) return;
  if (entry.pollTimer) {
    clearInterval(entry.pollTimer);
    entry.pollTimer = null;
  }
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(label || `Timeout ${ms}ms`)), ms)
    ),
  ]);
}

function mapGroupChat(c) {
  const id =
    (c && c.id && (c.id._serialized || c.id)) ||
    (typeof c.id === 'string' ? c.id : null);
  if (!id) return null;
  const name = (c && (c.name || c.formattedTitle || c.groupMetadata?.subject)) || String(id);
  return { id: String(id), name: String(name) };
}

/**
 * Charge les groupes WA.
 * Important: ne pas se fier uniquement à isGroup (groupMetadata parfois absent).
 * Filtre principal: id se termine par @g.us
 * @param {import('whatsapp-web.js').Client} client
 * @param {string} shopSlug
 */
async function fetchWhatsAppGroups(client, shopSlug) {
  const results = [];

  // 1) Injection directe — API WA Web moderne (WAWebCollections) utilisée par wwebjs 1.34+
  try {
    if (client.pupPage) {
      const raw = await withTimeout(
        client.pupPage.evaluate(async () => {
          const out = [];
          const push = (id, name) => {
            if (!id) return;
            const sid = String(id);
            if (!sid.endsWith('@g.us') && !sid.includes('@g.us')) return;
            out.push({
              id: sid,
              name: String(name || sid),
            });
          };

          // A) WWebJS helper (si injecté)
          try {
            if (window.WWebJS && typeof window.WWebJS.getChats === 'function') {
              const chats = await window.WWebJS.getChats();
              for (const c of chats || []) {
                const id = (c && c.id && (c.id._serialized || c.id)) || '';
                if (c && (c.isGroup || String(id).endsWith('@g.us'))) {
                  push(id, c.name || c.formattedTitle || id);
                }
              }
            }
          } catch (_) {}

          // B) WAWebCollections.Chat (chemin officiel actuel)
          try {
            const coll = window.require && window.require('WAWebCollections');
            const Chat = coll && coll.Chat;
            if (Chat && typeof Chat.getModelsArray === 'function') {
              const models = Chat.getModelsArray() || [];
              for (const m of models) {
                const id = m && m.id && m.id._serialized;
                const server = m && m.id && m.id.server;
                const isGroup =
                  server === 'g.us' ||
                  !!(m && m.groupMetadata) ||
                  (id && String(id).endsWith('@g.us'));
                if (isGroup) {
                  push(
                    id,
                    (m && (m.formattedTitle || m.name || m.__x_formattedTitle)) || id
                  );
                }
              }
            }
          } catch (_) {}

          // C) Ancien Store (versions legacy)
          try {
            const store = window.Store;
            if (store && store.Chat && store.Chat.getModelsArray) {
              for (const m of store.Chat.getModelsArray() || []) {
                const id = m && m.id && m.id._serialized;
                if (
                  (m && m.id && m.id.server === 'g.us') ||
                  (id && String(id).endsWith('@g.us'))
                ) {
                  push(id, (m && (m.formattedTitle || m.name)) || id);
                }
              }
            }
          } catch (_) {}

          return out;
        }),
        60000,
        'evaluate groups timeout'
      );
      if (Array.isArray(raw) && raw.length > 0) {
        console.log(`[${shopSlug}] Groupes via page.evaluate: ${raw.length}`);
        return dedupeGroups(raw);
      }
      console.warn(`[${shopSlug}] page.evaluate: 0 groupe (chats pas encore sync ?)`);
    }
  } catch (e) {
    console.warn(`[${shopSlug}] evaluate groups:`, e.message);
  }

  // 2) API client.getChats() — filtre @g.us (pas seulement isGroup)
  try {
    const chats = await withTimeout(client.getChats(), 60000, 'getChats timeout');
    console.log(`[${shopSlug}] getChats total=${(chats || []).length}`);
    for (const c of chats || []) {
      const id =
        (c && c.id && (c.id._serialized || c.id)) ||
        '';
      const sid = String(id);
      if (c && (c.isGroup || sid.endsWith('@g.us'))) {
        const g = mapGroupChat(c);
        if (g) results.push(g);
      }
    }
    if (results.length > 0) {
      console.log(`[${shopSlug}] Groupes via getChats: ${results.length}`);
      return dedupeGroups(results);
    }
  } catch (e) {
    console.warn(`[${shopSlug}] getChats:`, e.message);
  }

  console.log(`[${shopSlug}] Groupes trouvés: ${results.length}`);
  return dedupeGroups(results);
}

function dedupeGroups(list) {
  const map = new Map();
  for (const g of list) {
    if (g && g.id && !map.has(g.id)) map.set(g.id, g);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  );
}

async function refreshGroupsCache(shopSlug, { force = false } = {}) {
  const entry = getSession(shopSlug);
  if (!entry || !entry.client || entry.status !== 'connected') {
    return { ok: false, error: 'WhatsApp non connecte', groups: [] };
  }
  if (entry.groupsLoading) {
    // attendre un peu le load en cours
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 250));
      if (!entry.groupsLoading) break;
    }
    return { ok: true, groups: entry.groupsCache || [], cached: true };
  }

  const freshEnough =
    !force &&
    entry.groupsCache &&
    entry.groupsCache.length > 0 &&
    Date.now() - (entry.groupsCachedAt || 0) < 60000;

  if (freshEnough) {
    return { ok: true, groups: entry.groupsCache, cached: true };
  }

  entry.groupsLoading = true;
  try {
    const groups = await fetchWhatsAppGroups(entry.client, shopSlug);
    entry.groupsCache = groups;
    entry.groupsCachedAt = Date.now();
    return { ok: true, groups, cached: false };
  } catch (e) {
    console.error(`[${shopSlug}] refreshGroups:`, e.message);
    return {
      ok: false,
      error: e.message,
      groups: entry.groupsCache || [],
    };
  } finally {
    entry.groupsLoading = false;
  }
}

async function checkSheetForShop(shopSlug) {
  const entry = getSession(shopSlug);
  if (!entry || entry.status !== 'connected' || !entry.client) return;

  try {
    let shop;
    try {
      shop = await fetchShopSettings(shopSlug);
    } catch (e) {
      console.error(`[${shopSlug}] settings:`, e.message);
      return;
    }
    if (!shop || !shop.whatsapp_enabled || !shop.google_sheet_url || !shop.whatsapp_group_id) return;

    const sheetId = extractSheetId(shop.google_sheet_url);
    if (!sheetId) return;

    const auth = getGoogleAuth();
    if (!auth) return;
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:K',
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) return;

    const headerRow = rows[0] || [];
    const statutCol = headerRow.findIndex((h) =>
      (h || '').toLowerCase().includes('statut')
    );
    if (statutCol === -1) return;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;

      const statut = (row[statutCol] || '').trim().toLowerCase();
      if (statut === 'envoye' || statut === 'envoyé' || statut === 'envoye ') continue;

      const date = row[0] || '';
      const clientName = row[1] || '';
      const tel = row[2] || '';
      const adresse = row[3] || '';
      const quartier = row[4] || '';
      const produit = row[5] || '';
      const qte = row[6] || '';
      const total = row[7] || '';
      const devise = row[8] || 'FCFA';

      const msg =
        '*NOUVELLE COMMANDE* \n\n' +
        '*Client :* ' +
        clientName +
        '\n' +
        '*Tel :* ' +
        tel +
        '\n' +
        '*Adresse :* ' +
        adresse +
        ' (' +
        quartier +
        ')\n' +
        '*Produit :* ' +
        produit +
        ' x' +
        qte +
        '\n' +
        '*Total :* ' +
        total +
        ' ' +
        devise +
        '\n\n' +
        '⚡ _Commande du ' +
        date +
        '_';

      try {
        await entry.client.sendMessage(shop.whatsapp_group_id, msg);
        console.log(`[${shopSlug}] Commande ligne ${i + 1} envoyee`);
        entry.lastActivity = Date.now();
      } catch (sendErr) {
        console.error(`[${shopSlug}] Erreur envoi ligne ${i + 1}: ${sendErr.message}`);
        continue;
      }

      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: String.fromCharCode(65 + statutCol) + (i + 1),
          valueInputOption: 'RAW',
          resource: { values: [['Envoye']] },
        });
      } catch (_) {}
    }
  } catch (err) {
    if (err.code === 404) console.error(`[${shopSlug}] Sheet introuvable`);
    else if (err.code === 403) console.error(`[${shopSlug}] Acces refuse au sheet`);
    else console.error(`[${shopSlug}] checkSheet:`, err.message);
  }
}

function startPolling(shopSlug) {
  stopPolling(shopSlug);
  const entry = getSession(shopSlug);
  if (!entry) return;
  console.log(`[${shopSlug}] Poll sheet demarre (${POLL_INTERVAL / 1000}s)`);
  checkSheetForShop(shopSlug);
  entry.pollTimer = setInterval(() => checkSheetForShop(shopSlug), POLL_INTERVAL);
}

function attachClientEvents(shopSlug, client) {
  const entry = ensureSessionEntry(shopSlug);

  client.on('qr', (qr) => {
    entry.qrCodeData = qr;
    entry.pairingCodeData = null;
    entry.status = 'awaiting_scan';
    console.log(`[${shopSlug}] --- QR CODE GENERATED ---`);
    qrcode.generate(qr, { small: true });
    syncSessionDb(shopSlug, {
      status: 'awaiting_scan',
      last_qr_at: new Date().toISOString(),
      phone_number: null,
    });
  });

  client.on('authenticated', () => {
    console.log(`[${shopSlug}] WhatsApp auth OK`);
  });

  client.on('auth_failure', (m) => {
    console.error(`[${shopSlug}] WhatsApp auth FAIL:`, m);
    entry.status = 'error';
    entry.starting = false;
    syncSessionDb(shopSlug, { status: 'error' });
  });

  client.on('ready', async () => {
    entry.qrCodeData = null;
    entry.pairingCodeData = null;
    entry.status = 'connected';
    entry.starting = false;
    entry.lastActivity = Date.now();
    console.log(`[${shopSlug}] WhatsApp connecte`);

    let phone = null;
    try {
      const wid = client.info && client.info.wid;
      phone = wid ? String(wid.user || wid._serialized || '') : null;
      entry.phoneNumber = phone;
    } catch (_) {}

    // Précharger les groupes après sync WA (plusieurs tentatives)
    (async () => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 1 ? 4000 : 6000));
        const r = await refreshGroupsCache(shopSlug, { force: true });
        if (r.ok && r.groups.length > 0) {
          console.log(`[${shopSlug}] Cache groupes: ${r.groups.length}`);
          r.groups.slice(0, 30).forEach((g) => console.log(`  ${g.name} | ${g.id}`));
          return;
        }
        console.log(`[${shopSlug}] Groupes vides (essai ${attempt}/4)`);
      }
    })().catch((e) => console.warn(`[${shopSlug}] preload groups:`, e.message));

    await syncSessionDb(shopSlug, {
      status: 'connected',
      phone_number: phone,
      connected_at: new Date().toISOString(),
    });
    startPolling(shopSlug);
  });

  client.on('disconnected', (reason) => {
    entry.status = 'disconnected';
    entry.starting = false;
    entry.qrCodeData = null;
    entry.groupsCache = [];
    entry.groupsCachedAt = 0;
    console.log(`[${shopSlug}] WhatsApp deconnecte:`, reason);
    stopPolling(shopSlug);
    syncSessionDb(shopSlug, { status: 'disconnected' });
  });
}

async function destroyClient(shopSlug) {
  const entry = getSession(shopSlug);
  if (!entry) return;
  stopPolling(shopSlug);
  if (entry.client) {
    try {
      await entry.client.destroy();
    } catch (_) {}
    entry.client = null;
  }
  entry.starting = false;
  entry.qrCodeData = null;
  entry.pairingCodeData = null;
  entry.phoneNumber = null;
  entry.groupsCache = [];
  entry.groupsCachedAt = 0;
  entry.groupsLoading = false;
  entry.status = 'disconnected';
}

function createWaClient(shopSlug, extra = {}) {
  // Ne PAS figer webVersion (ex: 2.2401.1) — casse getChats/groupes sur WA Web actuel.
  // remote = dernière version compatible maintenue par la communauté.
  return new Client({
    authStrategy: new LocalAuth({
      clientId: shopSlug,
      dataPath: AUTH_ROOT,
    }),
    webVersionCache: {
      type: 'remote',
      remotePath:
        'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
    },
    puppeteer: puppeteerOptions(),
    ...extra,
  });
}

/**
 * Start or return existing session for a shop.
 * @param {string} shopSlug
 * @param {{ phone?: string, force?: boolean }} opts
 */
async function startSession(shopSlug, opts = {}) {
  const entry = ensureSessionEntry(shopSlug);

  if (entry.client && !opts.force && !opts.phone) {
    return { ok: true, entry, reused: true };
  }

  if (entry.starting && !opts.force) {
    return { ok: true, entry, reused: true };
  }

  if (!entry.client && countActiveClients() >= MAX_WA_SESSIONS) {
    return {
      ok: false,
      error: `Limite de sessions atteinte (${MAX_WA_SESSIONS}). Réessayez plus tard.`,
      code: 503,
    };
  }

  if (entry.client) {
    await destroyClient(shopSlug);
  }

  entry.starting = true;
  entry.status = 'initializing';
  entry.qrCodeData = null;
  entry.pairingCodeData = null;
  await syncSessionDb(shopSlug, { status: 'initializing' });

  const extra = {};
  if (opts.phone) {
    extra.pairWithPhoneNumber = { phoneNumber: String(opts.phone).replace(/\D/g, '') };
  }

  const client = createWaClient(shopSlug, extra);
  entry.client = client;
  attachClientEvents(shopSlug, client);

  try {
    await client.initialize();
  } catch (e) {
    console.error(`[${shopSlug}] initialize error:`, e.message);
    entry.starting = false;
    entry.status = 'error';
    entry.client = null;
    await syncSessionDb(shopSlug, { status: 'error' });
    return { ok: false, error: e.message, code: 500 };
  }

  return { ok: true, entry, reused: false };
}

async function resetSession(shopSlug) {
  await destroyClient(shopSlug);
  wipeAuthFiles(shopSlug);
  await syncSessionDb(shopSlug, {
    status: 'disconnected',
    phone_number: null,
    connected_at: null,
  });
  return startSession(shopSlug, { force: true });
}

async function disconnectSession(shopSlug, { wipe = false } = {}) {
  const entry = getSession(shopSlug);
  if (entry && entry.client) {
    try {
      await entry.client.logout();
    } catch (_) {}
  }
  await destroyClient(shopSlug);
  if (wipe) wipeAuthFiles(shopSlug);
  await syncSessionDb(shopSlug, {
    status: 'disconnected',
    phone_number: null,
  });
}

/* ─── Auth helpers ─── */

function decodeJwtPayload(accessToken) {
  try {
    const part = String(accessToken).split('.')[1];
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function userFromJwt(accessToken) {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return { user: null, reason: 'token_malformed' };

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= now) {
    return { user: null, reason: 'token_expired_or_invalid', status: 401 };
  }

  const claims = payload['https://hasura.io/jwt/claims'] || {};
  const id =
    payload.sub ||
    claims['x-hasura-user-id'] ||
    payload.userId ||
    null;
  if (!id) return { user: null, reason: 'token_invalid' };

  return {
    user: {
      id: String(id),
      email: payload.email || null,
    },
  };
}

/**
 * @returns {Promise<{ user: object|null, reason?: string, status?: number }>}
 */
async function resolveNhostUser(accessToken) {
  if (!accessToken) return { user: null, reason: 'missing_token' };

  // 1) JWT local (rapide, marche même si /user est flaky)
  const fromJwt = userFromJwt(accessToken);
  if (fromJwt.user) {
    // 2) Optionnel: confirmer via Nhost /user (ne bloque pas si KO)
    const bases = getNhostAuthBases();
    for (const base of bases) {
      try {
        const res = await fetch(`${base}/user`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const user = await res.json();
          if (user && user.id) return { user };
        }
      } catch (_) {}
    }
    return fromJwt;
  }

  if (fromJwt.reason === 'token_expired_or_invalid') {
    return fromJwt;
  }

  // 3) Fallback pure API si JWT non décodable
  const bases = getNhostAuthBases();
  if (bases.length === 0) {
    console.error(
      '[auth] Nhost non configure: definir NEXT_PUBLIC_NHOST_SUBDOMAIN (+ REGION) ou NHOST_AUTH_URL'
    );
    return { user: null, reason: 'nhost_not_configured' };
  }

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401 || res.status === 403) {
        return { user: null, reason: 'token_expired_or_invalid', status: res.status };
      }
      if (!res.ok) continue;
      const user = await res.json();
      if (user && user.id) return { user };
    } catch (e) {
      console.error(`[auth] Nhost fetch error (${base}):`, e.message);
    }
  }
  return { user: null, reason: 'token_invalid', status: 401 };
}

async function assertShopOwner(userId, shopSlug) {
  try {
    const settings = await fetchShopSettings(shopSlug);
    if (!settings) {
      return { ok: false, status: 404, error: 'Boutique introuvable' };
    }
    if (settings.user_id && String(settings.user_id) === String(userId)) {
      return { ok: true };
    }
    // Shop without owner yet — claim allowed for authenticated user of this admin path
    if (!settings.user_id) return { ok: true };

    if (await isUserSuperAdmin(userId)) return { ok: true };

    return { ok: false, status: 403, error: 'Acces refuse a cette boutique' };
  } catch (e) {
    console.error(`[${shopSlug}] owner check:`, e.message);
    return {
      ok: false,
      status: 500,
      error: 'Erreur verification boutique: ' + e.message,
    };
  }
}

/* ─── Express router ─── */

const router = express.Router();
router.use(express.json());

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bot-Secret');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    activeSessions: countActiveClients(),
    maxSessions: MAX_WA_SESSIONS,
    shops: Array.from(sessions.keys()),
  });
});

async function authMiddleware(req, res, next) {
  const shopSlug = sanitizeSlug(req.params.shopSlug);
  if (!shopSlug) {
    return res.status(400).json({ error: 'shop_slug invalide' });
  }
  req.shopSlug = shopSlug;

  const botSecret = req.headers['x-bot-secret'];
  if (BOT_SECRET && botSecret && botSecret === BOT_SECRET) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Non authentifie' });
  }

  const resolved = await resolveNhostUser(token);
  if (!resolved.user) {
    if (resolved.reason === 'nhost_not_configured') {
      return res.status(503).json({
        error: 'Auth Nhost non configuree sur le bot (NEXT_PUBLIC_NHOST_SUBDOMAIN)',
      });
    }
    if (resolved.reason === 'token_expired_or_invalid') {
      return res.status(401).json({
        error: 'Session expiree — reconnectez-vous',
      });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }

  const user = resolved.user;
  const ownership = await assertShopOwner(user.id, shopSlug);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ error: ownership.error });
  }

  req.user = user;
  next();
}

router.get('/:shopSlug/status', authMiddleware, async (req, res) => {
  const shopSlug = req.shopSlug;
  let entry = getSession(shopSlug);

  if (!entry || (!entry.client && !entry.starting)) {
    const authExists = fs.existsSync(sessionDir(shopSlug));
    if (authExists || req.query.connect === '1') {
      const result = await startSession(shopSlug);
      if (!result.ok) {
        return res.status(result.code || 500).json({
          error: result.error,
          status: 'error',
          hasQr: false,
          hasPairing: false,
        });
      }
      entry = result.entry;
    }
  }

  if (!entry) {
    return res.json({
      status: 'disconnected',
      hasQr: false,
      hasPairing: false,
      phoneNumber: null,
      shopSlug,
    });
  }

  res.json({
    status: entry.status,
    hasQr: !!entry.qrCodeData,
    hasPairing: !!entry.pairingCodeData,
    phoneNumber: entry.phoneNumber,
    shopSlug,
  });
});

router.post('/:shopSlug/connect', authMiddleware, async (req, res) => {
  const result = await startSession(req.shopSlug);
  if (!result.ok) {
    return res.status(result.code || 500).json({ error: result.error });
  }
  const entry = result.entry;
  res.json({
    success: true,
    status: entry.status,
    hasQr: !!entry.qrCodeData,
    shopSlug: req.shopSlug,
  });
});

router.get('/:shopSlug/qr-image', authMiddleware, (req, res) => {
  const entry = getSession(req.shopSlug);
  if (!entry || !entry.qrCodeData) {
    return res.status(404).send('Aucun QR');
  }
  QRCode.toDataURL(entry.qrCodeData, (err, url) => {
    if (err) return res.status(500).send('Erreur');
    const b = url.replace(/^data:image\/png;base64,/, '');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store',
    });
    res.end(Buffer.from(b, 'base64'));
  });
});

router.post('/:shopSlug/pairing', authMiddleware, async (req, res) => {
  const phone = req.body && req.body.phone;
  if (!phone) return res.status(400).json({ error: 'Numero requis' });

  const entry = getSession(req.shopSlug);
  if (entry && entry.status === 'connected') {
    return res.status(400).json({ error: 'Deja connecte' });
  }

  const result = await startSession(req.shopSlug, { phone, force: true });
  if (!result.ok) {
    return res.status(result.code || 500).json({ error: result.error });
  }
  res.json({ success: true, message: 'Code de couplage envoye' });
});

router.post('/:shopSlug/reset', authMiddleware, async (req, res) => {
  const result = await resetSession(req.shopSlug);
  if (!result.ok) {
    return res.status(result.code || 500).json({ error: result.error });
  }
  res.json({ success: true, message: 'Session reinitialisee', shopSlug: req.shopSlug });
});

router.post('/:shopSlug/disconnect', authMiddleware, async (req, res) => {
  const wipe = !!(req.body && req.body.wipe);
  await disconnectSession(req.shopSlug, { wipe });
  res.json({ success: true, status: 'disconnected' });
});

router.get('/:shopSlug/groups', authMiddleware, async (req, res) => {
  const entry = getSession(req.shopSlug);
  if (!entry || entry.status !== 'connected' || !entry.client) {
    return res.status(503).json({ error: 'WhatsApp non connecte' });
  }
  try {
    const force =
      req.query.refresh === '1' ||
      req.query.refresh === 'true' ||
      req.query.force === '1';
    const result = await refreshGroupsCache(req.shopSlug, { force });
    if (!result.ok && (!result.groups || result.groups.length === 0)) {
      return res.status(500).json({
        error: result.error || 'Impossible de charger les groupes',
        groups: [],
      });
    }
    // Réponse tableau (compat UI) + meta en header
    res.setHeader('X-Groups-Cached', result.cached ? '1' : '0');
    res.setHeader('X-Groups-Count', String((result.groups || []).length));
    res.json(result.groups || []);
  } catch (err) {
    console.error(`[${req.shopSlug}] /groups:`, err.message);
    res.status(500).json({ error: err.message, groups: [] });
  }
});

/* Legacy single-session routes → 410 */
function gone(req, res) {
  res.status(410).json({
    error: 'API multi-tenant requise. Utilisez /:shopSlug/status|qr-image|groups|reset|pairing|connect',
  });
}
router.get('/status', gone);
router.get('/qr-image', gone);
router.get('/groups', gone);
router.post('/pairing', gone);
router.post('/reset', gone);
router.post('/config', (req, res) => {
  res.json({ success: true, message: 'Config stockee cote boutique (settings)' });
});

process.on('uncaughtException', (err) => {
  console.error('Erreur:', err.message);
});

async function restoreEnabledSessions() {
  ensureAuthRoot();
  const { adminSecret, sub } = getNhostConfig();
  if (!sub || !adminSecret) {
    console.log('[boot] Nhost non configure — pas de restore auto');
    return;
  }
  try {
    const shops = await fetchEnabledWhatsappShops();
    if (!shops || shops.length === 0) return;

    let restored = 0;
    for (const shop of shops) {
      const slug = sanitizeSlug(shop.shop_slug);
      if (!slug) continue;
      if (!fs.existsSync(sessionDir(slug))) continue;
      if (restored >= MAX_WA_SESSIONS) {
        console.warn('[boot] MAX_WA_SESSIONS atteint, restore stoppe');
        break;
      }
      console.log(`[boot] Restore session ${slug}`);
      const result = await startSession(slug);
      if (result.ok) restored += 1;
    }
    console.log(`[boot] ${restored} session(s) restauree(s)`);
  } catch (e) {
    console.error('[boot] restore error:', e.message);
  }
}

ensureAuthRoot();

// Ancien cache webVersion 2.2401.1 → purger pour forcer version récente
try {
  if (fs.existsSync(CACHE_PATH)) {
    const stale = path.join(CACHE_PATH, '2.2401.1.html');
    if (fs.existsSync(stale)) {
      fs.rmSync(CACHE_PATH, { recursive: true, force: true });
      console.log('[boot] Cache WA Web obsolete purge');
    }
  }
} catch (_) {}

if (require.main === module) {
  const app = express();
  app.use(router);
  app.listen(PORT, () => {
    console.log(`WhatsApp bot multi-tenant sur port ${PORT}`);
    console.log(`AUTH_ROOT=${AUTH_ROOT} MAX_WA_SESSIONS=${MAX_WA_SESSIONS}`);
    restoreEnabledSessions();
  });
} else {
  setTimeout(() => restoreEnabledSessions(), 2000);
}

module.exports = router;

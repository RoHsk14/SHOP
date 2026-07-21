/**
 * Export users Supabase → import Nhost (email + metadata).
 * Les hash bcrypt Supabase ne sont pas importables via l'API Auth Nhost :
 * chaque user reçoit un mot de passe temporaire (à reset) sauf si --password=xxx.
 *
 * Usage:
 *   node scripts/migrate-users-supabase-to-nhost.mjs
 *   node scripts/migrate-users-supabase-to-nhost.mjs --dry-run
 *   node scripts/migrate-users-supabase-to-nhost.mjs --password='TempChangeMe123!'
 *
 * Env (whatsapp-bot/.env ou .env.local) :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_NHOST_SUBDOMAIN, NEXT_PUBLIC_NHOST_REGION
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

loadEnv(resolve(root, "services/whatsapp-bot/.env"));
loadEnv(resolve(root, ".env.local"));
loadEnv(resolve(root, ".env"));

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const pwArg = args.find((a) => a.startsWith("--password="));
const tempPassword = pwArg ? pwArg.slice("--password=".length) : `Temp${Date.now()}!Aa1`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUB = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "zkbpzymsaxwshpqiktlc";
const REG = process.env.NEXT_PUBLIC_NHOST_REGION || "eu-central-1";
const AUTH = `https://${SUB}.auth.${REG}.nhost.run/v1`;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function listSupabaseUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`Supabase listUsers ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const batch = data.users || data || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return users;
}

async function createNhostUser(email, password) {
  const res = await fetch(`${AUTH}/signup/email-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      options: { allowedRoles: ["user", "me"], defaultRole: "user" },
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

const users = await listSupabaseUsers();
const emails = [
  ...new Set(
    users
      .map((u) => u.email)
      .filter((e) => e && typeof e === "string")
      .map((e) => e.toLowerCase())
  ),
];

console.log(`Supabase: ${users.length} users, ${emails.length} emails uniques`);
console.log(`Nhost auth: ${AUTH}`);
console.log(dryRun ? "Mode dry-run (aucun import)" : `Import avec mdp temporaire: ${tempPassword}`);
console.log("---");

let ok = 0,
  skip = 0,
  fail = 0;

for (const email of emails) {
  if (dryRun) {
    console.log(`[dry] ${email}`);
    ok++;
    continue;
  }
  const { ok: success, status, body } = await createNhostUser(email, tempPassword);
  if (success) {
    console.log(`OK  ${email}`);
    ok++;
  } else if (
    status === 409 ||
    /already|exists|registered/i.test(JSON.stringify(body))
  ) {
    console.log(`SKIP ${email} (déjà sur Nhost)`);
    skip++;
  } else {
    console.log(`FAIL ${email} ${status} ${JSON.stringify(body)}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 300)); // éviter 429
}

console.log("---");
console.log(`Done: ok=${ok} skip=${skip} fail=${fail}`);
if (!dryRun && ok > 0) {
  console.log(`\nMots de passe temporaires: ${tempPassword}`);
  console.log("Les users devront reset leur mdp (ou se connecter via Google si lié).");
}

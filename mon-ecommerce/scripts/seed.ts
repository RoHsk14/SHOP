#!/usr/bin/env node
// Seed script — Nhost/Hasura (create tables + seed data)
// Usage: node --experimental-strip-types scripts/seed.ts
//        node --experimental-strip-types scripts/seed.ts --reset-orders

import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local ──
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx !== -1) env[t.slice(0, idx)] = t.slice(idx + 1);
}

const NHOST_SUB = env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "zkbpzymsaxwshpqiktlc";
const NHOST_REG = env.NEXT_PUBLIC_NHOST_REGION || "eu-central-1";
const ADMIN_SECRET = env.NHOST_ADMIN_SECRET || "";
const HASURA_URL = `https://${NHOST_SUB}.hasura.${NHOST_REG}.nhost.run/v1/query`;
const GQL_URL = `https://${NHOST_SUB}.graphql.${NHOST_REG}.nhost.run/v1`;

if (!ADMIN_SECRET) {
  console.error("❌ NHOST_ADMIN_SECRET manquant dans .env.local");
  process.exit(1);
}

// ── SQL helper ──
async function runSql(sql: string): Promise<any> {
  const res = await fetch(HASURA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ type: "run_sql", args: { sql } }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

// ── Hasura metadata tracking ──
async function trackTable(schema: string, table: string) {
  const res = await fetch(GQL_URL.replace("/v1", "/v1/metadata"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: "pg_track_table",
      args: { table: { schema, name: table } },
    }),
  });
  const data = await res.json();
  if (data.error && !data.error.includes("already tracked")) {
    console.warn(`  ⚠️  Track ${table}:`, data.error);
  }
}

async function trackRelationship(table: string, column: string, remoteTable: string) {
  const res = await fetch(GQL_URL.replace("/v1", "/v1/metadata"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: "pg_create_array_relationship",
      args: {
        table: { schema: "public", name: table },
        name: remoteTable + "s",
        using: {
          foreign_key_constraint_on: {
            table: { schema: "public", name: remoteTable },
            column,
          },
        },
      },
    }),
  });
}

async function trackPermissions(table: string, role: string = "public") {
  // Select permission (public read)
  await fetch(GQL_URL.replace("/v1", "/v1/metadata"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: "pg_create_select_permission",
      args: {
        table: { schema: "public", name: table },
        role,
        permission: {
          columns: "*",
          filter: {},
          allow_aggregations: true,
        },
      },
    }),
  }).then(r => r.json()).then(d => {
    if (d.error && !d.error.includes("already exists")) {
      console.warn(`  ⚠️  Perm select ${table}:`, d.error);
    }
  });

  // Insert permission (for authenticated users)
  await fetch(GQL_URL.replace("/v1", "/v1/metadata"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: "pg_create_insert_permission",
      args: {
        table: { schema: "public", name: table },
        role,
        permission: {
          columns: "*",
          check: {},
          backend_only: false,
        },
      },
    }),
  }).then(r => r.json()).then(d => {
    if (d.error && !d.error.includes("already exists")) {
      console.warn(`  ⚠️  Perm insert ${table}:`, d.error);
    }
  });

  // Update permission
  await fetch(GQL_URL.replace("/v1", "/v1/metadata"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: "pg_create_update_permission",
      args: {
        table: { schema: "public", name: table },
        role,
        permission: {
          columns: "*",
          filter: {},
          set: {},
          backend_only: false,
        },
      },
    }),
  }).then(r => r.json()).then(d => {
    if (d.error && !d.error.includes("already exists")) {
      console.warn(`  ⚠️  Perm update ${table}:`, d.error);
    }
  });

  // Delete permission
  await fetch(GQL_URL.replace("/v1", "/v1/metadata"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: "pg_create_delete_permission",
      args: {
        table: { schema: "public", name: table },
        role,
        permission: {
          filter: {},
          backend_only: false,
        },
      },
    }),
  }).then(r => r.json()).then(d => {
    if (d.error && !d.error.includes("already exists")) {
      console.warn(`  ⚠️  Perm delete ${table}:`, d.error);
    }
  });
}

// ──────────────────────────────────────────
// SQL: CREATE TABLES
// ──────────────────────────────────────────

async function createTables() {
  console.log("\n🔧 Création des tables...");

  await runSql(`
    CREATE TABLE IF NOT EXISTS settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      shop_slug TEXT UNIQUE,
      user_id UUID,
      owner_name TEXT DEFAULT '',
      shop_name TEXT DEFAULT '',
      shop_description TEXT DEFAULT '',
      shop_country TEXT DEFAULT '',
      theme_id TEXT DEFAULT 'classic',
      default_currency TEXT DEFAULT 'EUR',
      pixel_id TEXT DEFAULT '',
      capi_token TEXT DEFAULT '',
      logo_url TEXT,
      theme_config JSONB DEFAULT '{}',
      custom_form_fields JSONB DEFAULT '[]',
      google_sheet_url TEXT,
      is_super_admin BOOLEAN DEFAULT FALSE,
      whatsapp_group_id TEXT,
      whatsapp_enabled BOOLEAN DEFAULT FALSE,
      meta_app_id TEXT,
      meta_app_secret TEXT,
      meta_business_account_id TEXT,
      meta_access_token TEXT,
      meta_catalog_id TEXT,
      meta_page_id TEXT,
      meta_instagram_account_id TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      shop_slug TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'disconnected',
      phone_number TEXT,
      last_qr_at TIMESTAMPTZ,
      connected_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      shop_slug TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT DEFAULT '',
      price DECIMAL(12,2),
      sku TEXT,
      track_stock BOOLEAN DEFAULT FALSE,
      stock_quantity INTEGER DEFAULT 0,
      images TEXT[] DEFAULT '{}',
      sizes TEXT[] DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      shop_slug TEXT NOT NULL DEFAULT '',
      product_id UUID,
      product_name TEXT DEFAULT '',
      quantity INTEGER DEFAULT 1,
      total_price NUMERIC DEFAULT 0,
      currency TEXT DEFAULT 'XOF',
      customer_name TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      customer_address TEXT DEFAULT '',
      customer_neighborhood TEXT,
      offer_id UUID,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS offers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      shop_slug TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'bundle' CHECK (type IN ('bundle', 'quantity')),
      discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_quantity INTEGER DEFAULT 1,
      max_quantity INTEGER,
      products JSONB DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS visitors (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      shop_slug TEXT NOT NULL DEFAULT '',
      session_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      path TEXT DEFAULT '/',
      is_online BOOLEAN DEFAULT FALSE,
      last_seen TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS admin_devices (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      push_token TEXT UNIQUE NOT NULL,
      platform TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Indexes
  await runSql(`CREATE INDEX IF NOT EXISTS idx_products_shop_slug ON products(shop_slug);`);
  await runSql(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);`);
  await runSql(`CREATE INDEX IF NOT EXISTS idx_orders_shop_slug ON orders(shop_slug);`);
  await runSql(`CREATE INDEX IF NOT EXISTS idx_offers_shop_slug ON offers(shop_slug);`);
  await runSql(`CREATE INDEX IF NOT EXISTS idx_visitors_shop_slug ON visitors(shop_slug);`);

  console.log("  ✅ Tables créées");
}

// ──────────────────────────────────────────
// HASURA: Track tables
// ──────────────────────────────────────────

async function trackTables() {
  console.log("\n🔍 Tracking tables dans Hasura...");
  for (const table of ["settings", "products", "orders", "offers", "visitors", "admin_devices"]) {
    await trackTable("public", table);
  }
  await trackPermissions("settings", "public");
  await trackPermissions("products", "public");
  await trackPermissions("orders", "public");
  await trackPermissions("offers", "public");
  await trackPermissions("visitors", "public");
  await trackPermissions("admin_devices", "public");
  console.log("  ✅ Tables trackées + permissions configurées");
}

// ──────────────────────────────────────────
// SEED DATA
// ──────────────────────────────────────────

const SHOP = {
  shop_slug: "7xmysl",
  shop_name: "7Xmysl",
  owner_name: "Admin",
  shop_description: "Boutique de mode",
  shop_country: "Cote d'Ivoire",
  theme_id: "classic",
  default_currency: "XOF",
  pixel_id: "",
  capi_token: "",
};

const PRODUCTS = [
  {
    name: "T-Shirt Classique Noir",
    slug: "t-shirt-classique-noir",
    description: "T-shirt en coton 100% confortable",
    price: 15000,
    images: 'ARRAY[\'https://placehold.co/800x800?text=T-Shirt+Noir\']',
    sizes: "ARRAY['S','M','L','XL']",
    status: "active",
    track_stock: false,
    stock_quantity: 0,
    sku: "TS-001",
  },
  {
    name: "Jean Slim Bleu",
    slug: "jean-slim-bleu",
    description: "Jean slim pour homme",
    price: 25000,
    images: "ARRAY['https://placehold.co/800x800?text=Jean+Slim']",
    sizes: "ARRAY['38','40','42','44']",
    status: "active",
    track_stock: false,
    stock_quantity: 0,
    sku: "JN-001",
  },
  {
    name: "Robe Summer Floral",
    slug: "robe-summer-floral",
    description: "Robe ete fleurie pour femme",
    price: 30000,
    images: "ARRAY['https://placehold.co/800x800?text=Robe+Summer']",
    sizes: "ARRAY['S','M','L']",
    status: "active",
    track_stock: true,
    stock_quantity: 10,
    sku: "RB-001",
  },
  {
    name: "Sneakers Urban",
    slug: "sneakers-urban",
    description: "Sneakers tendance homme/femme",
    price: 35000,
    images: "ARRAY['https://placehold.co/800x800?text=Sneakers']",
    sizes: "ARRAY['40','41','42','43','44']",
    status: "active",
    track_stock: true,
    stock_quantity: 15,
    sku: "SN-001",
  },
];

function esc(s: string) {
  return s.replace(/'/g, "''");
}

async function seedSettings() {
  console.log("\n📦 Seeding settings...");

  const check = await runSql(`SELECT id FROM settings WHERE shop_slug = '${esc(SHOP.shop_slug)}' LIMIT 1;`);
  const rows = check.result || [];
  const exists = rows.length > 1;

  if (exists) {
    await runSql(`UPDATE settings SET
      shop_name = '${esc(SHOP.shop_name)}',
      owner_name = '${esc(SHOP.owner_name)}',
      shop_description = '${esc(SHOP.shop_description)}',
      shop_country = '${esc(SHOP.shop_country)}',
      theme_id = '${esc(SHOP.theme_id)}',
      default_currency = '${esc(SHOP.default_currency)}',
      pixel_id = '${esc(SHOP.pixel_id)}',
      capi_token = '${esc(SHOP.capi_token)}'
    WHERE shop_slug = '${esc(SHOP.shop_slug)}';`);
    console.log("  ✅ Settings mis à jour:", SHOP.shop_slug);
  } else {
    await runSql(`INSERT INTO settings (shop_slug, shop_name, owner_name, shop_description, shop_country, theme_id, default_currency, pixel_id, capi_token)
      VALUES ('${esc(SHOP.shop_slug)}', '${esc(SHOP.shop_name)}', '${esc(SHOP.owner_name)}', '${esc(SHOP.shop_description)}', '${esc(SHOP.shop_country)}', '${esc(SHOP.theme_id)}', '${esc(SHOP.default_currency)}', '${esc(SHOP.pixel_id)}', '${esc(SHOP.capi_token)}');`);
    console.log("  ✅ Settings créé:", SHOP.shop_slug);
  }
}

async function seedProducts() {
  console.log("\n📦 Seeding products...");

  let created = 0;
  let updated = 0;

  for (const p of PRODUCTS) {
    const check = await runSql(`SELECT id FROM products WHERE shop_slug = '${esc(SHOP.shop_slug)}' AND slug = '${esc(p.slug)}' LIMIT 1;`);
    const rows = check.result || [];
    const exists = rows.length > 1;

    if (exists) {
      await runSql(`UPDATE products SET
        name = '${esc(p.name)}',
        description = '${esc(p.description)}',
        price = ${p.price},
        images = ${p.images},
        sizes = ${p.sizes},
        status = '${esc(p.status)}',
        track_stock = ${p.track_stock},
        stock_quantity = ${p.stock_quantity},
        sku = '${esc(p.sku)}'
      WHERE shop_slug = '${esc(SHOP.shop_slug)}' AND slug = '${esc(p.slug)}';`);
      updated++;
    } else {
      await runSql(`INSERT INTO products (shop_slug, name, slug, description, price, images, sizes, status, track_stock, stock_quantity, sku)
        VALUES ('${esc(SHOP.shop_slug)}', '${esc(p.name)}', '${esc(p.slug)}', '${esc(p.description)}', ${p.price}, ${p.images}, ${p.sizes}, '${esc(p.status)}', ${p.track_stock}, ${p.stock_quantity}, '${esc(p.sku)}');`);
      created++;
    }
  }

  console.log(`  ✅ Produits: ${created} créés, ${updated} mis à jour`);
}

async function resetOrders() {
  console.log("\n🗑️  Reset orders...");
  await runSql(`DELETE FROM orders WHERE shop_slug = '${esc(SHOP.shop_slug)}';`);
  console.log("  ✅ Orders supprimées");
}

// ──────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────

async function main() {
  console.log("🚀 Seed pour:", SHOP.shop_slug);
  console.log("   Nhost:", NHOST_SUB, NHOST_REG);

  try {
    await createTables();
    await trackTables();
    await seedSettings();
    await seedProducts();

    if (process.argv.includes("--reset-orders")) {
      await resetOrders();
    }

    console.log("\n✅ Seed terminé !");
  } catch (err: any) {
    console.error("\n❌ Erreur:", err.message);
    process.exit(1);
  }
}

main();

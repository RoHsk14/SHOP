# Plan de Correction - Sécurité

> Généré après audit de sécurité du projet Mon E-commerce
> Date : 2026-05-08

---

## Table des matières
1. [🔴 CRITIQUE - RLS Policies (settings, products, orders)](#1--critique--rls-policies)
2. [🔴 CRITIQUE - Validation ID Google Sheets (SSRF)](#2--critique--validation-ssrf-google-sheets)
3. [🟠 ÉLEVÉE - Middleware de sécurité](#3---elevee--middleware-de-securite)
4. [🟠 ÉLEVÉE - Rate Limiting](#4---elevee--rate-limiting)
5. [🟡 MOYENNE - Validation prix côté serveur](#5---moyenne--validation-prix-cote-serveur)
6. [🟡 MOYENNE - Sanitization Google Sheets](#6---moyenne--sanitization-google-sheets)
7. [🔵 FAIBLE - Version Node.js](#7---faible--version-nodejs)
8. [🔵 FAIBLE - Purchase dédoublonné](#8---faible--purchase-dedoublonne)

---

## 1  🔴 CRITIQUE - RLS Policies

### Contexte
Toutes les tables (`settings`, `products`, `orders`, `visitors`) ont des politiques "public" qui permettent
à n'importe qui (avec l'anonymous key visible dans le bundle JS) de lire/écrire les données.

### À exécuter dans Supabase SQL Editor

```sql
-- ============================================
-- 1. SETTINGS : lecture admin uniquement
-- ============================================
DROP POLICY IF EXISTS "Allow public read access on settings" ON settings;

CREATE POLICY "Allow authenticated read on settings" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on settings" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 2. PRODUCTS : lecture publique, écriture admin
-- ============================================
DROP POLICY IF EXISTS "Allow public read access" ON products;

CREATE POLICY "Public read products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Admin insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 3. ORDERS : insertion publique, lecture admin
-- ============================================
DROP POLICY IF EXISTS "Allow public insert access" ON orders;

CREATE POLICY "Public insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin delete orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 4. VISITORS : insertion publique (tracking)
-- ============================================
DROP POLICY IF EXISTS "Allow public read access on visitors" ON visitors;

CREATE POLICY "Public insert visitors" ON visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public upsert visitors" ON visitors
  FOR UPDATE USING (true);

CREATE POLICY "Admin read visitors" ON visitors
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 5. Verification
-- ============================================
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 2  🔴 CRITIQUE - Validation SSRF Google Sheets

### Contexte
L'API Google Sheets accepte un `sheet_url` fourni par l'utilisateur sans validation stricte.
Un attaquant pourrait tenter d'exploiter une SSRF vers des services internes.

### Fichier à modifier
`src/app/api/google-sheets/route.ts`

### Changement

**Rechercher :**
```typescript
const sheetId = match[1];
```

**Remplacer par :**
```typescript
const sheetId = match[1];
if (!/^[a-zA-Z0-9_-]{30,}$/.test(sheetId)) {
  return NextResponse.json({ error: "ID Google Sheet invalide" }, { status: 400 });
}
```

### Fichier complet corrigé

```typescript
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet_url, columns, row_data } = body;

    if (!sheet_url) {
      return NextResponse.json({ error: "sheet_url required" }, { status: 400 });
    }

    const match = sheet_url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return NextResponse.json({ error: "URL Google Sheet invalide" }, { status: 400 });
    }
    const sheetId = match[1];
    if (!/^[a-zA-Z0-9_-]{30,}$/.test(sheetId)) {
      return NextResponse.json({ error: "ID Google Sheet invalide" }, { status: 400 });
    }

    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || path.join(process.cwd(), "service-account-key.json");
    if (!fs.existsSync(keyPath)) {
      return NextResponse.json({ error: "Fichier service-account-key.json manquant" }, { status: 500 });
    }

    const credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties",
    });

    const sheetName = sheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";

    const sanitize = (val: any) =>
      typeof val === "string" && val.startsWith("=") ? "'" + val : val;

    const values: any[] = [];
    if (columns && Array.isArray(columns)) {
      values.push(columns.map((col: string) => sanitize(row_data?.[col] ?? "")));
    } else {
      values.push([
        sanitize(row_data?.Date || new Date().toLocaleString("fr-FR")),
        sanitize(row_data?.Nom_du_client || ""),
        sanitize(row_data?.Téléphone || ""),
        sanitize(row_data?.Adresse || ""),
        sanitize(row_data?.Quartier || ""),
        sanitize(row_data?.Produit || ""),
        sanitize(row_data?.Quantité || 1),
        sanitize(row_data?.Total || 0),
        sanitize(row_data?.Devise || "EUR"),
        sanitize(row_data?.Statut || "pending"),
      ]);
    }

    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
      majorDimension: "ROWS",
    });

    const rows = headerResponse.data.values || [];

    if (rows.length === 0) {
      const headers = columns && Array.isArray(columns) ? columns : [
        "Date", "Nom du client", "Téléphone", "Adresse", "Quartier",
        "Produit", "Quantité", "Total", "Devise", "Statut",
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: sheetName + "!A1",
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: sheetName,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    if (response.status === 200) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Échec de l'envoi vers le Sheet" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Google Sheets integration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 3  🟠 ÉLEVÉE - Middleware de sécurité

### Contexte
Aucun fichier `middleware.ts` n'existe. Les Security Headers (CSP, HSTS, X-Frame-Options)
ne sont pas configurés. La protection admin contournable sans JS.

### Fichier à créer
`src/middleware.ts`

### Contenu

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get(
      "sb-lwivyouaiizweukrnrtz.supabase.co-auth-token"
    );
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

---

## 4  🟠 ÉLEVÉE - Rate Limiting

### Contexte
Les endpoints API sont totalement ouverts sans limitation de débit.
Un attaquant peut flooder la base de données ou épuiser les quotas API.

### Option A : Upstash Ratelimit (recommandé)

1. Installer :
```bash
npm install @upstash/ratelimit @upstash/redis
```

2. Ajouter les variables d'env dans Vercel :
```
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx
```

3. Créer un utilitaire `src/lib/rateLimit.ts` :
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await rateLimit.limit(identifier);
  if (!success) {
    throw new Error(`Rate limit exceeded. Reset in ${reset}ms`);
  }
  return { limit, remaining, reset };
}
```

4. Utiliser dans chaque API route :
```typescript
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await checkRateLimit(ip);
    // ... reste du code
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  }
}
```

### Option B : Vercel WAF (Edge, sans Redis)
Activer WAF dans Vercel Dashboard > Security > WAF > Rate Limiting.
Configurer 10 requêtes / 10 secondes par IP.

---

## 5  🟡 MOYENNE - Validation prix côté serveur

### Contexte
Le client envoie `totalPrice` calculé côté navigateur. Un attaquant peut modifier
cette valeur pour commander à 0,01€.

### Solution recommandée
Créer un endpoint API pour les commandes qui valide le prix côté serveur.

### Fichier à créer
`src/app/api/orders/route.ts`

### Contenu

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, quantity, total_price, currency, customer_name, customer_phone, customer_address } = body;

    if (!product_id || !quantity || !customer_name || !customer_phone) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("prices")
      .eq("id", product_id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const prices = product.prices || {};
    const productCurrency = Object.keys(prices)[0];
    const unitPrice = Object.values(prices)[0] as number;
    const realTotal = unitPrice * quantity;

    if (Math.abs(realTotal - total_price) > 0.01) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }

    const orderData = {
      product_id,
      quantity,
      total_price: realTotal,
      currency: productCurrency,
      customer_name,
      customer_phone,
      customer_address: customer_address || "",
    };

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 6  🟡 MOYENNE - Sanitization Google Sheets

### Contexte
Les données insérées dans Google Sheets ne sont pas nettoyées. Des formules Sheets
malveillantes (=HYPERLINK, =IMPORTXML) pourraient être injectées.

### Déjà corrigé partiellement
Voir la section [2](#2--critique--validation-ssrf-google-sheets) — la fonction `sanitize()` est incluse
dans le fichier corrigé.

Vérifier que cette fonction est présente dans :
- `src/app/api/google-sheets/route.ts` → ✅ inclus dans le correctif
- `src/app/api/google-sheets/init/route.ts` → à vérifier
- `src/app/api/google-sheets/columns/route.ts` → à vérifier

---

## 7  🔵 FAIBLE - Version Node.js

### Contexte
Aucune version Node.js spécifiée. Vercel peut utiliser une version incompatible.

### Fichier à modifier
`package.json`

### Ajouter
```json
"engines": {
  "node": ">=18.0.0"
}
```

---

## 8  🔵 FAIBLE - Purchase dédoublonné

### Contexte
`trackPurchase` est appelé deux fois (CheckoutForm + thank-you page).
Meta peut compter 2 achats pour 1 commande.

### Fichier à modifier
`src/components/CheckoutForm.tsx`

### Rechercher et supprimer
```typescript
metaPixel.trackPurchase({
  value: totalPrice, currency: productCurrency, num_items: quantity,
  content_ids: [product.id], content_name: product.name, content_type: "product",
});
```

### Laisser uniquement dans `src/app/thank-you/page.tsx` (déjà présent)

---

## Résumé des correctifs

| # | Gravité | Correctif | Où | Fait ? |
|---|---------|-----------|-----|--------|
| 1 | 🔴 | RLS Policies | Supabase SQL Editor | ❌ Manu |
| 2 | 🔴 | Validation SSRF | `google-sheets/route.ts` | ❌ Manu |
| 3 | 🟠 | Middleware | `src/middleware.ts` | ❌ Manu |
| 4 | 🟠 | Rate Limiting | Dépend du choix | ❌ Manu |
| 5 | 🟡 | Validation prix | `api/orders/route.ts` | ❌ Manu |
| 6 | 🟡 | Sanitization Sheets | Voir correctif #2 | ✅ Inclus |
| 7 | 🔵 | engines node | `package.json` | ❌ Manu |
| 8 | 🔵 | Purchase dédoublonné | `CheckoutForm.tsx` | ❌ Manu |

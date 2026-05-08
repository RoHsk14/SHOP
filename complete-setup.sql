-- Script de configuration complet pour E-Commerce
-- À exécuter dans Supabase > SQL Editor

-- 1. Création de la table products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  currency_code TEXT DEFAULT 'EUR' NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  prices JSONB DEFAULT '{"EUR": 199.99}'::jsonb,
  stock INTEGER DEFAULT 0,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Création de la table orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_neighborhood TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Création de la table settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pixel_id TEXT,
  capi_token TEXT,
  default_currency TEXT DEFAULT 'EUR',
  custom_form_fields JSONB DEFAULT '[
    {"name": "customer_name", "label": "Nom complet", "required": true},
    {"name": "customer_phone", "label": "Téléphone", "required": true},
    {"name": "customer_address", "label": "Adresse", "required": true}
  ]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Activer Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques d'accès (suppression préalable si existent)
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
CREATE POLICY "Allow public read access on products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
CREATE POLICY "Allow public insert on orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access on orders" ON orders;
CREATE POLICY "Allow read access on orders" ON orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on settings" ON settings;
CREATE POLICY "Allow public read access on settings" ON settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update on settings" ON settings;
CREATE POLICY "Allow update on settings" ON settings
  FOR UPDATE USING (true) WITH CHECK (true);

-- 6. Insérer les données initiales
-- Produit de test (avec gestion de conflit sur le nom)
INSERT INTO products (name, description, prices, stock, image_url, base_price, currency_code)
SELECT
  'Montre de Luxe Édition Limitée',
  'Découvrez l''élégance intemporelle avec cette montre de luxe exclusive. Conçue avec précision et style, elle est le compagnon idéal pour toutes les occasions.',
  '{"EUR": 199.99, "XAF": 131000, "USD": 216}'::jsonb,
  50,
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
  199.99,
  'EUR'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Montre de Luxe Édition Limitée');

-- Configuration initiale
INSERT INTO settings (pixel_id, default_currency)
SELECT NULL, 'EUR'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Message de confirmation
SELECT 'Configuration terminée avec succès !' as message;

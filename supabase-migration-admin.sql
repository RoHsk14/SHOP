-- Migration pour le Dashboard Admin
-- Date: 2026-05-04

-- 1. Création de la table settings
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

-- Enable RLS on settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings (pour le storefront)
CREATE POLICY "Allow public read access on settings" ON settings
  FOR SELECT USING (true);

-- 2. Ajout de la colonne prices (JSONB) à la table products
ALTER TABLE products ADD COLUMN IF NOT EXISTS prices JSONB DEFAULT '{"EUR": 199.99}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. Ajout de colonnes à la table orders pour plus de détails
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_neighborhood TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Insertion d'une configuration par défaut dans settings
INSERT INTO settings (pixel_id, default_currency)
SELECT NULL, 'EUR'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- 5. Mise à jour du produit existant avec le nouveau format de prix
UPDATE products
SET prices = jsonb_build_object(
  'EUR', base_price,
  'XAF', base_price * 655.96,
  'USD', base_price * 1.08
)
WHERE prices IS NULL OR prices = '{"EUR": 199.99}'::jsonb;

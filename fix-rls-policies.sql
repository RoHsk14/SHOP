-- Script pour corriger les politques RLS (version complète)
-- À exécuter dans Supabase > SQL Editor

-- 1. Supprimer TOUTES les politques existantes pour ces tables
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
DROP POLICY IF EXISTS "Allow public insert on products" ON products;
DROP POLICY IF EXISTS "Allow public update on products" ON products;

DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
DROP POLICY IF EXISTS "Allow read access on orders" ON orders;
DROP POLICY IF EXISTS "Allow update on orders" ON orders;

DROP POLICY IF EXISTS "Allow public read access on settings" ON settings;
DROP POLICY IF EXISTS "Allow update on settings" ON settings;

-- 2. Désactiver RLS temporairement pour s'assurer que tout est propre
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- 3. Réactiver RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politques pour products
CREATE POLICY "Allow public read access on products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on products" ON products
  FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Politques pour orders
CREATE POLICY "Allow public insert on orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access on orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Allow update on orders" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- 6. Politques pour settings
CREATE POLICY "Allow public read access on settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Allow update on settings" ON settings
  FOR UPDATE USING (true) WITH CHECK (true);

-- 7. Insérer un produit de test directement
INSERT INTO products (name, description, prices, stock, image_url, base_price, currency_code)
VALUES (
  'Montre de Luxe Édition Limitée',
  'Découvrez l''élégance intemporelle avec cette montre de luxe exclusive.',
  '{"EUR": 199.99, "XAF": 131000, "USD": 216}'::jsonb,
  50,
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
  199.99,
  'EUR'
) ON CONFLICT DO NOTHING;

-- Message de confirmation
SELECT 'Configuration terminée ! Produit et politques créés.' as message;

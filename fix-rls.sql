-- Script pour corriger les politques RLS
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer les anciennes politques si elles existent
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
DROP POLICY IF EXISTS "Allow public insert on products" ON products;
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
DROP POLICY IF EXISTS "Allow read access on orders" ON orders;
DROP POLICY IF EXISTS "Allow public read access on settings" ON settings;
DROP POLICY IF EXISTS "Allow update on settings" ON settings;

-- 2. Nouvelles politques pour products
CREATE POLICY "Allow public read access on products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on products" ON products
  FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Politques pour orders
CREATE POLICY "Allow public insert on orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access on orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Allow update on orders" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Politques pour settings
CREATE POLICY "Allow public read access on settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Allow update on settings" ON settings
  FOR UPDATE USING (true) WITH CHECK (true);

-- Message de confirmation
SELECT 'Politques RLS mises à jour avec succès !' as message;

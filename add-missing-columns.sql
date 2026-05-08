-- Script pour ajouter les colonnes manquantes à la table products
-- À exécuter dans Supabase > SQL Editor

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS regular_price NUMERIC,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
  ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS cost_per_item NUMERIC;

-- Ajouter aussi la colonne enabled_currencies dans settings si elle n'existe pas
ALTER TABLE settings 
  ADD COLUMN IF NOT EXISTS enabled_currencies JSONB DEFAULT '["EUR", "XAF", "USD"]'::jsonb;

-- Message de confirmation
SELECT 'Colonnes ajoutées avec succès !' as message;

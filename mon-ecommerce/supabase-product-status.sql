-- Add status column to products table
-- 'active' = visible on storefront, 'inactive' = hidden
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Set all existing products to active
UPDATE products SET status = 'active' WHERE status IS NULL;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);

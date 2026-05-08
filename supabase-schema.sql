-- Initial Schema for E-Commerce Platform

-- Create Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  currency_code TEXT DEFAULT 'EUR' NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) - basic setup for public inserts on orders, and reads on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to products
CREATE POLICY "Allow public read access" ON products
  FOR SELECT USING (true);

-- Allow anonymous inserts to orders
CREATE POLICY "Allow public insert access" ON orders
  FOR INSERT WITH CHECK (true);

-- Note: You should restrict read/update/delete on orders to authenticated admin users in production.

-- Insert a dummy product for testing
INSERT INTO products (name, base_price, currency_code, image_url)
VALUES ('Montre de Luxe Édition Limitée', 199.99, 'EUR', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop');

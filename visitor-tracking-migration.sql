-- Visitors tracking table (Shopify-like analytics)
CREATE TABLE IF NOT EXISTS visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  path TEXT,
  is_online BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_visitors_online ON visitors(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on visitors" ON visitors;
CREATE POLICY "Allow all operations on visitors" 
ON visitors 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Function to clean old visitors (run periodically via cron)
-- SELECT * FROM cleanup_old_visitors();
CREATE OR REPLACE FUNCTION cleanup_old_visitors()
RETURNS void AS $$
BEGIN
  DELETE FROM visitors 
  WHERE last_seen < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

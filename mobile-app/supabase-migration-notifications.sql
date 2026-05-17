-- Table for storing admin push notification tokens
CREATE TABLE IF NOT EXISTS admin_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  push_token TEXT UNIQUE NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: only authenticated admins can read/write
ALTER TABLE admin_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage devices"
  ON admin_devices
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime for orders table (for live new-order detection)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

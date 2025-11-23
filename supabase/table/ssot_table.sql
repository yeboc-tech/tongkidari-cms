-- Create SSOT (Single Source of Truth) table
CREATE TABLE IF NOT EXISTS public.ssot (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_ssot_key ON public.ssot(key);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ssot_updated_at
  BEFORE UPDATE ON public.ssot
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.ssot IS 'Single Source of Truth table for storing configuration and curriculum data';
COMMENT ON COLUMN public.ssot.key IS 'Unique identifier key (e.g., "CHAPTER_사회탐구_경제")';
COMMENT ON COLUMN public.ssot.value IS 'JSON data associated with the key';

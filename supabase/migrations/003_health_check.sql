-- =====================================================
-- Health Check Table Schema & Initial Data
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create the health table
CREATE TABLE IF NOT EXISTS public.health (
  id INT PRIMARY KEY DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ok',
  message TEXT DEFAULT 'System operational',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.health ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read-only access (anonymous and authenticated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'health' 
      AND policyname = 'Allow public read-only access to health'
  ) THEN
    CREATE POLICY "Allow public read-only access to health"
      ON public.health
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- 4. Seed initial health data with 'ok' status
INSERT INTO public.health (id, status, message, updated_at)
VALUES (1, 'ok', 'System operational', NOW())
ON CONFLICT (id) 
DO UPDATE SET 
  status = 'ok',
  message = 'System operational',
  updated_at = NOW();

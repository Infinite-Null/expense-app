-- =====================================================
-- Expense Tracker — Spaces / Organizations Schema Migration
-- Safe & idempotent script for Supabase SQL Editor
-- =====================================================

-- 1. Create table public.spaces if not exists
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'layers',
  color TEXT DEFAULT '#4F46E5',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add space_id column to expenses table (nullable for backward compatibility)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON public.spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_space_id ON public.expenses(space_id);

-- 4. Enable Row Level Security (RLS) on spaces
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS policies (drop first if re-running)
DROP POLICY IF EXISTS "Users can view own spaces" ON public.spaces;
CREATE POLICY "Users can view own spaces"
  ON public.spaces FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own spaces" ON public.spaces;
CREATE POLICY "Users can insert own spaces"
  ON public.spaces FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own spaces" ON public.spaces;
CREATE POLICY "Users can update own spaces"
  ON public.spaces FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own spaces" ON public.spaces;
CREATE POLICY "Users can delete own spaces"
  ON public.spaces FOR DELETE
  USING (user_id = auth.uid());

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS on_spaces_updated ON public.spaces;
CREATE TRIGGER on_spaces_updated
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Backward compatibility backfill:
-- Automatically create Space 1 (named after user's display name or 'Personal') for every existing user,
-- and link all existing unassigned expenses to that default space.
DO $$
DECLARE
  u RECORD;
  new_space_id UUID;
  user_name TEXT;
BEGIN
  FOR u IN SELECT id, raw_user_meta_data FROM auth.users LOOP
    -- Only create if the user does not have any space yet
    IF NOT EXISTS (SELECT 1 FROM public.spaces WHERE user_id = u.id) THEN
      SELECT COALESCE(p.display_name, u.raw_user_meta_data->>'display_name', 'Personal')
      INTO user_name
      FROM public.profiles p WHERE p.id = u.id;

      IF user_name IS NULL OR TRIM(user_name) = '' THEN
        user_name := 'Personal';
      END IF;

      INSERT INTO public.spaces (user_id, name, is_default)
      VALUES (u.id, user_name, TRUE)
      RETURNING id INTO new_space_id;

      -- Assign all existing expenses of this user to their new default space
      UPDATE public.expenses
      SET space_id = new_space_id
      WHERE user_id = u.id AND space_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- Expense Tracker — Initial Schema
-- Run this in Supabase SQL Editor (or via supabase CLI)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_currency TEXT NOT NULL DEFAULT 'INR',
  preferred_locale TEXT NOT NULL DEFAULT 'en-IN',
  theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = system default
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- System default categories (visible to all users, user_id = NULL)
INSERT INTO public.categories (id, user_id, name, icon, color, is_default) VALUES
  (uuid_generate_v4(), NULL, 'Food & Dining', 'utensils', '#FF6B6B', TRUE),
  (uuid_generate_v4(), NULL, 'Groceries', 'shopping-basket', '#4ECDC4', TRUE),
  (uuid_generate_v4(), NULL, 'Transportation', 'car', '#45B7D1', TRUE),
  (uuid_generate_v4(), NULL, 'Shopping', 'shopping-bag', '#96CEB4', TRUE),
  (uuid_generate_v4(), NULL, 'Housing & Rent', 'home', '#FFEAA7', TRUE),
  (uuid_generate_v4(), NULL, 'Utilities', 'zap', '#DDA0DD', TRUE),
  (uuid_generate_v4(), NULL, 'Health & Medical', 'heart', '#FF8A80', TRUE),
  (uuid_generate_v4(), NULL, 'Entertainment', 'film', '#80DEEA', TRUE),
  (uuid_generate_v4(), NULL, 'Travel', 'plane', '#A5D6A7', TRUE),
  (uuid_generate_v4(), NULL, 'Education', 'book-open', '#CE93D8', TRUE),
  (uuid_generate_v4(), NULL, 'Subscriptions', 'refresh-cw', '#FFCC80', TRUE),
  (uuid_generate_v4(), NULL, 'Personal Care', 'smile', '#F48FB1', TRUE),
  (uuid_generate_v4(), NULL, 'Gifts & Donations', 'gift', '#80CBC4', TRUE),
  (uuid_generate_v4(), NULL, 'Other', 'more-horizontal', '#B0BEC5', TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE: tags
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- =====================================================
-- TABLE: expenses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  merchant TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'other')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: expense_tags (join table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expense_tags (
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, tag_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_date ON public.expenses(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense_id ON public.expense_tags(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag_id ON public.expense_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- =====================================================
-- FUNCTIONS: auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_tags_updated
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_expenses_updated
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tags ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- CATEGORIES policies (users can see system defaults + their own)
CREATE POLICY "Users can view system and own categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid());

-- TAGS policies
CREATE POLICY "Users can view own tags"
  ON public.tags FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tags"
  ON public.tags FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tags"
  ON public.tags FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tags"
  ON public.tags FOR DELETE
  USING (user_id = auth.uid());

-- EXPENSES policies
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (user_id = auth.uid());

-- EXPENSE_TAGS policies (via expense ownership)
CREATE POLICY "Users can view own expense tags"
  ON public.expense_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own expense tags"
  ON public.expense_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_id AND e.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.tags t
      WHERE t.id = tag_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own expense tags"
  ON public.expense_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_id AND e.user_id = auth.uid()
    )
  );

-- =============================================
-- VETO-CARE: ALL-IN-ONE DATABASE FIX
-- Paste this ENTIRE script into Supabase SQL Editor and click RUN
-- =============================================

-- -----------------------------------------------
-- PART 1: Fix profiles table columns
-- -----------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='experience') THEN
    ALTER TABLE profiles ADD COLUMN experience text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='specialty') THEN
    ALTER TABLE profiles ADD COLUMN specialty text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='certificate_url') THEN
    ALTER TABLE profiles ADD COLUMN certificate_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- -----------------------------------------------
-- PART 2: Fix profiles RLS policies
-- -----------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- -----------------------------------------------
-- PART 3: Fix pets table + columns
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE pets ADD COLUMN IF NOT EXISTS species text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS breed text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age integer;

-- -----------------------------------------------
-- PART 4: Fix pets RLS policies
-- -----------------------------------------------
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'pets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON pets', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own pets"
  ON pets FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Allow users to insert their own pets"
  ON pets FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow users to update their own pets"
  ON pets FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow users to delete their own pets"
  ON pets FOR DELETE USING (owner_id = auth.uid());

-- -----------------------------------------------
-- PART 5: Auto-create profile on signup (trigger)
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'patient')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

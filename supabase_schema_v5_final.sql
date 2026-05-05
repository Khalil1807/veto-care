-- Veto-Care Final Schema Setup (Run this in Supabase SQL Editor)

-- 1. Ensure profiles has all the necessary fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'patient';
    END IF;
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

-- 2. Create the Pets Table if it doesn't exist
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text,
  breed text,
  age integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS (Row Level Security) for pets
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- 4. Fix Policies for Pets (Drop first so we don't get 'already exists' error)
DROP POLICY IF EXISTS "select_own_pets" ON pets;
CREATE POLICY "select_own_pets" ON pets FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_pets" ON pets;
CREATE POLICY "insert_own_pets" ON pets FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "update_own_pets" ON pets;
CREATE POLICY "update_own_pets" ON pets FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_pets" ON pets;
CREATE POLICY "delete_own_pets" ON pets FOR DELETE USING (owner_id = auth.uid());

-- 5. Fix Policies for Profiles (Anyone can select, so doctors can see patients and vice versa)
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT USING (true);

-- Allow users to update their own profiles
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

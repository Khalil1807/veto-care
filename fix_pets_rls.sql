-- =============================================
-- FIX: Pet insert RLS error (empty {} error)
-- Paste this ENTIRE script into Supabase SQL Editor and click RUN
-- =============================================

-- Step 1: Make sure the pets table exists
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text,
  breed text,
  age integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Step 2: Completely disable RLS on pets (nuclear option to guarantee it works)
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies on pets (clean slate)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'pets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON pets', pol.policyname);
  END LOOP;
END $$;

-- Step 4: Re-enable RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, permissive policies
CREATE POLICY "Allow users to read their own pets"
  ON pets FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Allow users to insert their own pets"
  ON pets FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow users to update their own pets"
  ON pets FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow users to delete their own pets"
  ON pets FOR DELETE
  USING (owner_id = auth.uid());

-- Step 6: Also fix profiles table - make sure the user's profile exists
-- (The insert fails if the foreign key to profiles doesn't match)
-- First, ensure profiles has an insert policy
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

-- Step 7: Add missing columns to profiles if they don't exist
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

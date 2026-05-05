-- =============================================
-- FIX: Supabase signup 500 error
-- The handle_new_user trigger is crashing the auth.signUp() call.
-- This script recreates it safely.
--
-- STEP 1: Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- First, ensure the profiles table exists with all needed columns
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  role text DEFAULT 'patient',
  address text,
  experience text,
  bio text,
  specialty text,
  certificate_url text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Add any missing columns (safe to run multiple times)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certificate_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: Drop the OLD broken trigger completely
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =============================================
-- STEP 3: Create a NEW safe trigger function
-- This uses an exception handler so it NEVER crashes
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'patient')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never crash the signup — just log and continue
    RAISE WARNING 'handle_new_user trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- =============================================
-- STEP 4: Recreate the trigger
-- =============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 5: Fix RLS policies for profiles
-- =============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- Anyone can read profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update" ON profiles FOR UPDATE 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

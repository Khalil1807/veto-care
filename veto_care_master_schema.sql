-- ==========================================
-- VETO-CARE MASTER SCHEMA 
-- (Copy and run this entire file in Supabase SQL Editor)
-- ==========================================

-- ------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  role text DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
  address text,
  experience text,
  bio text,
  specialty text,
  certificate_url text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT USING (true); -- Anyone can see profiles

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());


-- ------------------------------------------
-- 2. PETS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text,
  breed text,
  age integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Policies for pets (Only the owner can manage their pets)
DROP POLICY IF EXISTS "select_own_pets" ON pets;
CREATE POLICY "select_own_pets" ON pets FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_pets" ON pets;
CREATE POLICY "insert_own_pets" ON pets FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "update_own_pets" ON pets;
CREATE POLICY "update_own_pets" ON pets FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_pets" ON pets;
CREATE POLICY "delete_own_pets" ON pets FOR DELETE USING (owner_id = auth.uid());


-- ------------------------------------------
-- 3. APPOINTMENTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vet_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE,
  date timestamp with time zone NOT NULL,
  status text DEFAULT 'pending',
  reason text,
  health_record_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies for appointments (Patients AND Doctors can see/update their relevant appointments)
DROP POLICY IF EXISTS "select_own_appointments" ON appointments;
CREATE POLICY "select_own_appointments" ON appointments 
  FOR SELECT USING (owner_id = auth.uid() OR vet_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_appointments" ON appointments;
CREATE POLICY "insert_own_appointments" ON appointments 
  FOR INSERT WITH CHECK (owner_id = auth.uid()); -- Only patients book appointments

DROP POLICY IF EXISTS "update_own_appointments" ON appointments;
CREATE POLICY "update_own_appointments" ON appointments 
  FOR UPDATE USING (owner_id = auth.uid() OR vet_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid() OR vet_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_appointments" ON appointments;
CREATE POLICY "delete_own_appointments" ON appointments 
  FOR DELETE USING (owner_id = auth.uid());

-- 1. Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'patient' CHECK (role IN ('patient', 'doctor'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certificate_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text,
  breed text,
  age integer
);

-- Enable RLS for pets
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_pets" ON pets;
CREATE POLICY "select_own_pets" ON pets FOR SELECT USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "insert_own_pets" ON pets;
CREATE POLICY "insert_own_pets" ON pets FOR INSERT WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "update_own_pets" ON pets;
CREATE POLICY "update_own_pets" ON pets FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "delete_own_pets" ON pets;
CREATE POLICY "delete_own_pets" ON pets FOR DELETE USING (owner_id = auth.uid());

-- 3. Update appointments table to use pets instead of string
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pet_id uuid REFERENCES pets(id) ON DELETE CASCADE;

-- We also need to change vet_id to point to profiles instead of veterinarians.
-- Since Supabase limits altering constraints easily, let's just create a new vet column or recreate appointments if data is minimal.
-- Let's drop the old constraint and add a new one.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_vet_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_vet_id_fkey FOREIGN KEY (vet_id) REFERENCES profiles(id) ON DELETE RESTRICT;

-- Note: In a production environment with existing data, changing a foreign key target requires data migration.
-- We assume this is early development.

-- Let Doctors see appointments assigned to them
DROP POLICY IF EXISTS "select_own_appointments" ON appointments;
CREATE POLICY "select_own_appointments" ON appointments
  FOR SELECT USING (owner_id = auth.uid() OR vet_id = auth.uid());

DROP POLICY IF EXISTS "update_own_appointments" ON appointments;
CREATE POLICY "update_own_appointments" ON appointments
  FOR UPDATE USING (owner_id = auth.uid() OR vet_id = auth.uid()) WITH CHECK (owner_id = auth.uid() OR vet_id = auth.uid());

-- Allow anyone to select profiles (so patients can see doctors)
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT USING (true);

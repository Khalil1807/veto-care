-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles table (linked to Supabase Auth via the same UUID)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text NOT NULL UNIQUE,
  full_name text,
  phone text
);

-- 2. veterinarians table
CREATE TABLE IF NOT EXISTS veterinarians (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  specialty text NOT NULL,
  image_url text
);

-- 3. appointments table (junction)
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vet_id uuid NOT NULL REFERENCES veterinarians(id) ON DELETE RESTRICT,
  "date" timestamptz NOT NULL,
  pet_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed')),
  health_record_url text
);

-- 4. Enable Row Level Security (RLS) for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: owners can SELECT their own appointments
CREATE POLICY "select_own_appointments" ON appointments
  FOR SELECT USING (owner_id = auth.uid());

-- Policy: owners can INSERT appointments with their own owner_id
CREATE POLICY "insert_own_appointments" ON appointments
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Policy: owners can UPDATE their own appointments
CREATE POLICY "update_own_appointments" ON appointments
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Policy: owners can DELETE their own appointments
CREATE POLICY "delete_own_appointments" ON appointments
  FOR DELETE USING (owner_id = auth.uid());

-- 5. RLS for profiles (so users can read/write only their own row)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE USING (id = auth.uid());

-- 6. Storage bucket (to be created via Supabase dashboard/UI)
-- Bucket name: health-records (public read allowed via generated URLs)
-- Note: Set this bucket to Public in the Supabase Dashboard, so anyone can read the uploaded files using the public URL.

-- Note: Supabase automatically generates public URLs with: supabase.storage.from('health-records').getPublicUrl(path)

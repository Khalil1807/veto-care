-- ==========================================
-- MEDICAL RECORDS AND VACCINATIONS SCHEMA
-- Run this in your Supabase SQL Editor
-- ==========================================

-- ------------------------------------------
-- 1. MEDICAL RECORDS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vet_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  diagnosis text NOT NULL,
  treatment text,
  notes text,
  attachments text[], -- Array of URLs for attached files
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Doctors can see records they created, owners can see records for their pets
DROP POLICY IF EXISTS "select_medical_records" ON medical_records;
CREATE POLICY "select_medical_records" ON medical_records 
  FOR SELECT USING (
    vet_id = auth.uid() OR 
    pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
  );

-- Doctors can insert medical records
DROP POLICY IF EXISTS "insert_medical_records" ON medical_records;
CREATE POLICY "insert_medical_records" ON medical_records 
  FOR INSERT WITH CHECK (vet_id = auth.uid());

-- Doctors can update their own records
DROP POLICY IF EXISTS "update_medical_records" ON medical_records;
CREATE POLICY "update_medical_records" ON medical_records 
  FOR UPDATE USING (vet_id = auth.uid()) WITH CHECK (vet_id = auth.uid());


-- ------------------------------------------
-- 2. VACCINATIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vet_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  vaccine_name text NOT NULL,
  date_given timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  next_due timestamp with time zone,
  status text DEFAULT 'completed'
);

-- Enable RLS
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

-- Doctors and owners can view vaccinations
DROP POLICY IF EXISTS "select_vaccinations" ON vaccinations;
CREATE POLICY "select_vaccinations" ON vaccinations 
  FOR SELECT USING (
    vet_id = auth.uid() OR 
    pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
  );

-- Doctors can insert vaccinations
DROP POLICY IF EXISTS "insert_vaccinations" ON vaccinations;
CREATE POLICY "insert_vaccinations" ON vaccinations 
  FOR INSERT WITH CHECK (vet_id = auth.uid());

-- Doctors can update vaccinations
DROP POLICY IF EXISTS "update_vaccinations" ON vaccinations;
CREATE POLICY "update_vaccinations" ON vaccinations 
  FOR UPDATE USING (vet_id = auth.uid()) WITH CHECK (vet_id = auth.uid());
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS date timestamp with time zone;
NOTIFY pgrst, 'reload schema';


-- ------------------------------------------
-- 3. STORAGE BUCKET (If not already exists)
-- ------------------------------------------
-- This creates a bucket named "health-records" and makes it public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('health-records', 'health-records', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to "health-records"
DROP POLICY IF EXISTS "allow_auth_insert" ON storage.objects;
CREATE POLICY "allow_auth_insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'health-records');

-- Allow anyone to select/read public files from "health-records"
DROP POLICY IF EXISTS "allow_public_select" ON storage.objects;
CREATE POLICY "allow_public_select" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'health-records');

-- 1. Safely make email optional (if the column exists)
DO $$
BEGIN
    IF EXISTS(SELECT *
        FROM information_schema.columns
        WHERE table_name='profiles' and column_name='email')
    THEN
        ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- 2. Make phone unique (so no two users can register with the same phone)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);

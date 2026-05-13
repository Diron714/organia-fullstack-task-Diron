-- Ensure admin account exists and has a known-good password.
-- Password plain text: Organia@Admin1
-- Safe to run: INSERT IGNORE skips if admin already exists; UPDATE always fixes the hash.

INSERT IGNORE INTO users (name, email, password, role, is_verified, created_at, updated_at)
VALUES (
  'Admin',
  'admin@organia.com',
  '$2b$12$t2THN.tqZ9BkmDm1szkDW.vkHa91XddT.ML60jR55lY4HU0qC91wS',
  'ADMIN',
  TRUE,
  NOW(),
  NOW()
);

-- Also update in case the row already exists with a bad hash (covers V7/V18 failures)
UPDATE users
SET
  password   = '$2b$12$t2THN.tqZ9BkmDm1szkDW.vkHa91XddT.ML60jR55lY4HU0qC91wS',
  is_verified = TRUE,
  role        = 'ADMIN',
  updated_at  = NOW()
WHERE email = 'admin@organia.com';

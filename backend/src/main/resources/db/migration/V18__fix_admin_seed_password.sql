-- Seed admin (V7) password must match plain text Admin123! (bcrypt cost 12).
-- Applies to existing databases; new installs should also set this in V7.
UPDATE users
SET password = '$2a$12$In3nm19dlh.bGYhAs3OxtOmy7esh0vYng/VelL6xLtDf9waXP96Hm'
WHERE email = 'admin@organia.com';

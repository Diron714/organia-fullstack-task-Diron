INSERT INTO users (name, email, password, role, is_verified)
VALUES (
  'Admin User',
  'admin@organia.com',
  '$2a$12$In3nm19dlh.bGYhAs3OxtOmy7esh0vYng/VelL6xLtDf9waXP96Hm',
  'ADMIN',
  TRUE
);
-- Password: Admin123! (bcrypt 12). V18 reapplies the same hash for DBs created before this fix.

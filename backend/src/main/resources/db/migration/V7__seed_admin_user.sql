INSERT INTO users (name, email, password, role, is_verified)
VALUES (
  'Admin User',
  'admin@organia.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RvAGE5erm',
  'ADMIN',
  TRUE
);
-- Password: Admin123! (bcrypt 12). V18 reapplies the same hash for DBs created before this fix.

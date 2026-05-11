-- Seed admin (V7) password must match plain text Admin123! (bcrypt cost 12).
UPDATE users
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RvAGE5erm'
WHERE email = 'admin@organia.com';

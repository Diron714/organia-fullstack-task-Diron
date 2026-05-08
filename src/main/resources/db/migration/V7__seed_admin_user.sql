INSERT INTO users (name, email, password, role, is_verified)
VALUES (
  'Admin User',
  'admin@organia.com',
  '$2a$12$LQ1234567890AbcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP',
  'ADMIN',
  TRUE
);
-- NOTE: Replace the password hash above with bcrypt hash of 'Admin123!'
-- Generate with: htpasswd -bnBC 12 "" Admin123! | tr -d ':\n'

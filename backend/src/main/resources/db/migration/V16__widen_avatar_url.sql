-- Avatars are stored as data URLs (base64); VARCHAR(255) truncates and breaks saves.
ALTER TABLE users MODIFY COLUMN avatar_url MEDIUMTEXT NULL;

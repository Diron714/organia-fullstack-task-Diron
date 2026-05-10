-- Ensure avatar data URLs fit (V16 may have been skipped if the app was not restarted after it was added).
ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL;

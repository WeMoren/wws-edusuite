-- Add optional phone numbers to user accounts.

ALTER TABLE users
    ADD COLUMN phone VARCHAR(30);

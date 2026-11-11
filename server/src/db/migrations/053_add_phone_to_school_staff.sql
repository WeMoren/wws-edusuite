-- Add optional phone numbers to central staff identities.
-- Preserve existing phone numbers from linked user accounts.

ALTER TABLE school_staff
    ADD COLUMN phone VARCHAR(30);

UPDATE school_staff ss
SET phone = u.phone
FROM users u
WHERE u.school_staff_id = ss.id
  AND u.phone IS NOT NULL;

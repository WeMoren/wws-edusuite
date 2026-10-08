BEGIN;

-- Remove the school-scoped email uniqueness constraint.
ALTER TABLE users
DROP CONSTRAINT unique_user_email_per_school;

-- Make user email globally unique because login uses email without a School ID.
ALTER TABLE users
ADD CONSTRAINT unique_user_email UNIQUE (email);

COMMIT;

BEGIN;

-- ============================================================
-- 1. SUPPORT COMPOSITE SCHOOL-SCOPED FOREIGN KEYS
-- ============================================================

-- The existing primary keys remain unchanged.
-- These additional unique constraints let PostgreSQL verify
-- that referenced records belong to the expected school.

ALTER TABLE school_staff
ADD CONSTRAINT unique_school_staff_school_id_id
UNIQUE (school_id, id);

ALTER TABLE users
ADD CONSTRAINT unique_users_school_id_id
UNIQUE (school_id, id);

-- ============================================================
-- 2. ENFORCE USER-TO-STAFF SCHOOL CONSISTENCY
-- ============================================================

ALTER TABLE users
DROP CONSTRAINT fk_users_school_staff;

ALTER TABLE users
ADD CONSTRAINT fk_users_school_staff_school_consistency
FOREIGN KEY (school_id, school_staff_id)
REFERENCES school_staff (school_id, id)
ON DELETE RESTRICT;

-- ============================================================
-- 3. ENFORCE INVITATION-TO-STAFF SCHOOL CONSISTENCY
-- ============================================================

ALTER TABLE staff_invitations
DROP CONSTRAINT staff_invitations_school_staff_id_fkey;

ALTER TABLE staff_invitations
ADD CONSTRAINT fk_staff_invitations_school_staff
FOREIGN KEY (school_id, school_staff_id)
REFERENCES school_staff (school_id, id)
ON DELETE NO ACTION;

-- ============================================================
-- 4. ENFORCE INVITATION-TO-INVITER SCHOOL CONSISTENCY
-- ============================================================

ALTER TABLE staff_invitations
DROP CONSTRAINT staff_invitations_invited_by_user_id_fkey;

ALTER TABLE staff_invitations
ADD CONSTRAINT fk_staff_invitations_inviter_school
FOREIGN KEY (school_id, invited_by_user_id)
REFERENCES users (school_id, id)
ON DELETE NO ACTION;

COMMIT;

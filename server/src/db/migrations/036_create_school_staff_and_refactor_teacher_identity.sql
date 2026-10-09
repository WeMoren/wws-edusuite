BEGIN;

-- ============================================================
-- 036 CREATE SCHOOL STAFF AND REFACTOR TEACHER IDENTITY
--
-- Purpose:
-- 1. Create the central school_staff identity layer.
-- 2. Create controlled staff positions.
-- 3. Create historical staff position assignments.
-- 4. Link every existing login account to a staff identity.
-- 5. Refactor teachers so they represent teacher profiles,
--    not login accounts.
-- 6. Allow class teachers who do not have login accounts.
--
-- Existing data is preserved.
-- No organizational positions are assigned automatically.
-- ============================================================


-- ============================================================
-- 1. CENTRAL STAFF IDENTITY
-- ============================================================

CREATE TABLE school_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    staff_id VARCHAR(50) NOT NULL,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    gender VARCHAR(20)
        CHECK (gender IN ('Male', 'Female')),

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_school_staff_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_staff_id_per_school
        UNIQUE (school_id, staff_id)
);


-- ============================================================
-- 2. STAFF POSITION CATALOGUE
--
-- Stable UUIDs are intentional here so database-level
-- constraints can safely identify special positions such as
-- Head Teacher without querying another table from an index.
-- ============================================================

CREATE TABLE staff_positions (
    id UUID PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


INSERT INTO staff_positions (
    id,
    code,
    name,
    description
)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'principal',
    'Principal',
    'School principal and administrative authority.'
),
(
    '00000000-0000-0000-0000-000000000002',
    'head_teacher',
    'Head Teacher',
    'Head teacher responsible for academic and teaching coordination.'
),
(
    '00000000-0000-0000-0000-000000000003',
    'exam_officer',
    'Examination Officer',
    'Officer responsible for examination and result administration.'
),
(
    '00000000-0000-0000-0000-000000000004',
    'accountant',
    'Accountant',
    'Staff member responsible for school accounting operations.'
),
(
    '00000000-0000-0000-0000-000000000005',
    'teacher',
    'Teacher',
    'Teaching staff member without implying a login account.'
);


-- ============================================================
-- 3. STAFF POSITION ASSIGNMENTS
-- ============================================================

CREATE TABLE staff_position_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    staff_id UUID NOT NULL,

    position_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    ended_at TIMESTAMPTZ,

    CONSTRAINT fk_staff_position_assignments_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_staff_position_assignments_staff
        FOREIGN KEY (staff_id)
        REFERENCES school_staff(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_staff_position_assignments_position
        FOREIGN KEY (position_id)
        REFERENCES staff_positions(id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_staff_position_assignment_dates
        CHECK (
            (status = 'active' AND ended_at IS NULL)
            OR
            (status = 'inactive' AND ended_at IS NOT NULL)
        )
);


-- ============================================================
-- 4. ONE ACTIVE HEAD TEACHER PER SCHOOL
--
-- Because the Head Teacher position has a stable UUID, a
-- partial unique index can enforce this directly at database
-- level without an invalid subquery.
-- ============================================================

CREATE UNIQUE INDEX unique_active_head_teacher_per_school
ON staff_position_assignments (school_id)
WHERE
    status = 'active'
    AND position_id = '00000000-0000-0000-0000-000000000002';


-- ============================================================
-- 5. ADD STAFF IDENTITY TO USERS
--
-- Initially nullable so existing records can be populated
-- safely before the final NOT NULL constraint is applied.
-- ============================================================

ALTER TABLE users
ADD COLUMN school_staff_id UUID;


-- ============================================================
-- 6. TEMPORARY MIGRATION MAP
--
-- Every existing login receives exactly one staff identity.
--
-- Existing teacher login:
--     preserves the existing teacher staff ID, e.g. TCH001.
--
-- Other users:
--     receive a deterministic generated staff ID based on
--     their user UUID.
-- ============================================================

CREATE TEMP TABLE migration_user_staff_map (
    user_id UUID PRIMARY KEY,
    school_staff_id UUID NOT NULL,
    generated_staff_id VARCHAR(50) NOT NULL
);


INSERT INTO migration_user_staff_map (
    user_id,
    school_staff_id,
    generated_staff_id
)
SELECT
    u.id,
    gen_random_uuid(),

    COALESCE(
        t.staff_id,
        'STF-' || LEFT(REPLACE(u.id::TEXT, '-', ''), 12)
    )

FROM users u

LEFT JOIN teachers t
    ON t.user_id = u.id;


-- ============================================================
-- 7. SAFETY CHECK
--
-- Ensure generated staff IDs are unique within each school
-- before inserting them.
-- ============================================================

DO $$
BEGIN

    IF EXISTS (
        SELECT
            u.school_id,
            m.generated_staff_id
        FROM migration_user_staff_map m
        JOIN users u
            ON u.id = m.user_id
        GROUP BY
            u.school_id,
            m.generated_staff_id
        HAVING COUNT(*) > 1
    ) THEN

        RAISE EXCEPTION
            'Migration 036 aborted: duplicate generated staff IDs detected.';

    END IF;

END
$$;


-- ============================================================
-- 8. CREATE STAFF IDENTITY FOR EVERY EXISTING USER
--
-- Gender is copied only when it already exists on the teacher
-- profile. We never invent gender for existing users.
-- ============================================================

INSERT INTO school_staff (
    id,
    school_id,
    staff_id,
    first_name,
    last_name,
    gender,
    status
)
SELECT
    m.school_staff_id,
    u.school_id,
    m.generated_staff_id,
    u.first_name,
    u.last_name,
    t.gender,
    u.status

FROM migration_user_staff_map m

JOIN users u
    ON u.id = m.user_id

LEFT JOIN teachers t
    ON t.user_id = u.id;


-- ============================================================
-- 9. LINK EVERY EXISTING USER TO STAFF IDENTITY
-- ============================================================

UPDATE users u

SET school_staff_id = m.school_staff_id

FROM migration_user_staff_map m

WHERE u.id = m.user_id;


-- ============================================================
-- 10. VERIFY EVERY USER WAS LINKED
-- ============================================================

DO $$
BEGIN

    IF EXISTS (
        SELECT 1
        FROM users
        WHERE school_staff_id IS NULL
    ) THEN

        RAISE EXCEPTION
            'Migration 036 aborted: one or more users could not be linked to school_staff.';

    END IF;

END
$$;


-- ============================================================
-- 11. MAKE USER → STAFF RELATIONSHIP REQUIRED
-- ============================================================

ALTER TABLE users
ALTER COLUMN school_staff_id SET NOT NULL;


-- ============================================================
-- 12. ONE LOGIN ACCOUNT PER STAFF MEMBER
-- ============================================================

ALTER TABLE users
ADD CONSTRAINT unique_user_school_staff
UNIQUE (school_staff_id);


ALTER TABLE users
ADD CONSTRAINT fk_users_school_staff
FOREIGN KEY (school_staff_id)
REFERENCES school_staff(id)
ON DELETE RESTRICT;


-- ============================================================
-- 13. REFRACTOR TEACHERS
--
-- Current teachers table:
--     user_id
--     staff_id VARCHAR
--     first_name
--     last_name
--     gender
--
-- New teachers table concept:
--     staff_id UUID → school_staff.id
--     subject
--
-- Teacher identity now comes from school_staff.
-- ============================================================

ALTER TABLE teachers
DROP CONSTRAINT unique_teacher_user_per_school;


ALTER TABLE teachers
DROP CONSTRAINT unique_teacher_staff_id_per_school;


ALTER TABLE teachers
ADD COLUMN new_staff_id UUID;


-- ============================================================
-- 14. CONNECT EXISTING TEACHER PROFILES TO STAFF IDENTITIES
-- ============================================================

UPDATE teachers t

SET new_staff_id = m.school_staff_id

FROM migration_user_staff_map m

WHERE t.user_id = m.user_id;


-- ============================================================
-- 15. VERIFY EVERY TEACHER PROFILE WAS LINKED
-- ============================================================

DO $$
BEGIN

    IF EXISTS (
        SELECT 1
        FROM teachers
        WHERE new_staff_id IS NULL
    ) THEN

        RAISE EXCEPTION
            'Migration 036 aborted: one or more teacher profiles could not be linked to school_staff.';

    END IF;

END
$$;


-- ============================================================
-- 16. PREPARE NEW TEACHER STAFF FOREIGN KEY
-- ============================================================

ALTER TABLE teachers
ALTER COLUMN new_staff_id SET NOT NULL;


-- ============================================================
-- 17. REMOVE OLD TEACHER → USER RELATIONSHIP
-- ============================================================

ALTER TABLE teachers
DROP CONSTRAINT fk_teachers_user;


ALTER TABLE teachers
DROP COLUMN user_id;


-- ============================================================
-- 18. REMOVE OLD DUPLICATED STAFF IDENTITY DATA
-- ============================================================

ALTER TABLE teachers
DROP COLUMN staff_id;



ALTER TABLE teachers
DROP COLUMN gender;


-- ============================================================
-- 19. RENAME NEW STAFF REFERENCE
-- ============================================================

ALTER TABLE teachers
RENAME COLUMN new_staff_id TO staff_id;


-- ============================================================
-- 20. TEACHER → SCHOOL STAFF FOREIGN KEY
-- ============================================================

ALTER TABLE teachers
ADD CONSTRAINT fk_teachers_staff
FOREIGN KEY (staff_id)
REFERENCES school_staff(id)
ON DELETE CASCADE;


-- ============================================================
-- 21. ONE TEACHER PROFILE PER STAFF MEMBER PER SCHOOL
-- ============================================================

ALTER TABLE teachers
ADD CONSTRAINT unique_teacher_staff_per_school
UNIQUE (school_id, staff_id);


-- ============================================================
-- 22. REFRACTOR SECTION CLASS-TEACHER RELATIONSHIP
--
-- Existing sections.class_teacher_id currently references
-- users.id.
--
-- It will now reference school_staff.id.
--
-- Existing section assignments are NULL, so no data
-- conversion is required.
-- ============================================================

ALTER TABLE sections
DROP CONSTRAINT fk_sections_class_teacher;


ALTER TABLE sections
ADD CONSTRAINT fk_sections_class_teacher
FOREIGN KEY (class_teacher_id)
REFERENCES school_staff(id)
ON DELETE SET NULL;


-- ============================================================
-- 23. REMOVE TEMPORARY MIGRATION OBJECT
-- ============================================================

DROP TABLE migration_user_staff_map;


-- ============================================================
-- 24. FINAL MIGRATION CHECKS
-- ============================================================

DO $$
DECLARE
    user_count INTEGER;
    linked_user_count INTEGER;
    teacher_count INTEGER;
    linked_teacher_count INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO user_count
    FROM users;

    SELECT COUNT(*)
    INTO linked_user_count
    FROM users
    WHERE school_staff_id IS NOT NULL;

    SELECT COUNT(*)
    INTO teacher_count
    FROM teachers;

    SELECT COUNT(*)
    INTO linked_teacher_count
    FROM teachers
    WHERE staff_id IS NOT NULL;

    IF user_count <> linked_user_count THEN
        RAISE EXCEPTION
            'Migration 036 verification failed: not every user has a staff identity.';
    END IF;

    IF teacher_count <> linked_teacher_count THEN
        RAISE EXCEPTION
            'Migration 036 verification failed: not every teacher has a staff identity.';
    END IF;

END
$$;


COMMIT;
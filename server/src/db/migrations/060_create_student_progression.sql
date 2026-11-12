BEGIN;

-- ============================================================
-- 1. STUDENT PROGRESSION PERMISSIONS
-- ============================================================

INSERT INTO permissions (resource, action, description)
VALUES
    ('studentProgression', 'view', 'View student progression'),
    ('studentProgression', 'create', 'Create student progression batches'),
    ('studentProgression', 'edit', 'Process and manage student progression operations')
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'studentProgression'
   AND p.action IN ('view', 'create', 'edit')
WHERE r.name IN ('Principal', 'School Admin', 'Exam Officer')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ============================================================
-- 2. COMPOSITE KEYS FOR SCHOOL-SCOPED RELATIONSHIPS
-- ============================================================

-- Students already have (school_id, id) from migration 048.
-- Users already have (school_id, id) from migration 041.

ALTER TABLE academic_sessions
ADD CONSTRAINT unique_academic_sessions_school_id_id
UNIQUE (school_id, id);

-- The enrollment key also includes student and session identity.
-- This allows progression records to verify all three relationships.
ALTER TABLE student_enrollments
ADD CONSTRAINT unique_student_enrollments_progression_reference
UNIQUE (school_id, id, student_id, academic_session_id);

-- Strengthen existing enrollment ownership relationships.
ALTER TABLE student_enrollments
ADD CONSTRAINT fk_student_enrollments_student_school
FOREIGN KEY (school_id, student_id)
REFERENCES students (school_id, id)
ON DELETE CASCADE;

ALTER TABLE student_enrollments
ADD CONSTRAINT fk_student_enrollments_session_school
FOREIGN KEY (school_id, academic_session_id)
REFERENCES academic_sessions (school_id, id)
ON DELETE RESTRICT;


-- ============================================================
-- 3. PROGRESSION BATCHES
-- ============================================================

CREATE TABLE student_progression_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    source_academic_session_id UUID NOT NULL,
    destination_academic_session_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'completed',

    total_students INTEGER NOT NULL DEFAULT 0,
    promoted_count INTEGER NOT NULL DEFAULT 0,
    repeated_count INTEGER NOT NULL DEFAULT 0,
    graduated_count INTEGER NOT NULL DEFAULT 0,
    transferred_count INTEGER NOT NULL DEFAULT 0,
    withdrawn_count INTEGER NOT NULL DEFAULT 0,

    processed_by UUID,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_progression_batches_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_progression_batches_source_session
        FOREIGN KEY (school_id, source_academic_session_id)
        REFERENCES academic_sessions (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_progression_batches_destination_session
        FOREIGN KEY (school_id, destination_academic_session_id)
        REFERENCES academic_sessions (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_progression_batches_processor
        FOREIGN KEY (processed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_progression_batches_processor_school
        FOREIGN KEY (school_id, processed_by)
        REFERENCES users (school_id, id),

    CONSTRAINT valid_progression_batch_status
        CHECK (status IN ('completed')),

    CONSTRAINT different_progression_sessions
        CHECK (source_academic_session_id <> destination_academic_session_id),

    CONSTRAINT valid_progression_batch_counts
        CHECK (
            total_students >= 0
            AND promoted_count >= 0
            AND repeated_count >= 0
            AND graduated_count >= 0
            AND transferred_count >= 0
            AND withdrawn_count >= 0
            AND total_students = (
                promoted_count
                + repeated_count
                + graduated_count
                + transferred_count
                + withdrawn_count
            )
        ),

    CONSTRAINT unique_progression_batch_school_reference
        UNIQUE (
            school_id,
            id,
            source_academic_session_id,
            destination_academic_session_id
        )
);


-- ============================================================
-- 4. INDIVIDUAL STUDENT PROGRESSION RECORDS
-- ============================================================

CREATE TABLE student_progression_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    batch_id UUID NOT NULL,
    student_id UUID NOT NULL,

    source_enrollment_id UUID NOT NULL,
    destination_enrollment_id UUID,

    source_academic_session_id UUID NOT NULL,
    destination_academic_session_id UUID NOT NULL,

    outcome VARCHAR(20) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_progression_records_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_progression_records_batch
        FOREIGN KEY (
            school_id,
            batch_id,
            source_academic_session_id,
            destination_academic_session_id
        )
        REFERENCES student_progression_batches (
            school_id,
            id,
            source_academic_session_id,
            destination_academic_session_id
        )
        ON DELETE RESTRICT,

    CONSTRAINT fk_progression_records_student
        FOREIGN KEY (school_id, student_id)
        REFERENCES students (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_progression_records_source_enrollment
        FOREIGN KEY (
            school_id,
            source_enrollment_id,
            student_id,
            source_academic_session_id
        )
        REFERENCES student_enrollments (
            school_id,
            id,
            student_id,
            academic_session_id
        )
        ON DELETE RESTRICT,

    CONSTRAINT fk_progression_records_destination_enrollment
        FOREIGN KEY (
            school_id,
            destination_enrollment_id,
            student_id,
            destination_academic_session_id
        )
        REFERENCES student_enrollments (
            school_id,
            id,
            student_id,
            academic_session_id
        )
        ON DELETE RESTRICT,

    CONSTRAINT valid_progression_outcome
        CHECK (
            outcome IN (
                'promote',
                'repeat',
                'graduate',
                'transfer',
                'withdraw'
            )
        ),

    CONSTRAINT valid_progression_destination
        CHECK (
            (
                outcome IN ('promote', 'repeat')
                AND destination_enrollment_id IS NOT NULL
            )
            OR
            (
                outcome IN ('graduate', 'transfer', 'withdraw')
                AND destination_enrollment_id IS NULL
            )
        ),

    CONSTRAINT unique_student_per_progression_batch
        UNIQUE (batch_id, student_id),

    CONSTRAINT unique_source_enrollment_progression
        UNIQUE (source_enrollment_id),

    CONSTRAINT unique_destination_enrollment_progression
        UNIQUE (destination_enrollment_id)
);


-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX idx_progression_batches_school
    ON student_progression_batches (school_id, processed_at DESC);

CREATE INDEX idx_progression_records_batch
    ON student_progression_records (batch_id);

CREATE INDEX idx_progression_records_student
    ON student_progression_records (school_id, student_id);


COMMIT;

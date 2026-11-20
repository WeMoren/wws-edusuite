
BEGIN;

-- ============================================================
-- 1. PROMOTION CRITERIA OVERRIDE PERMISSION
-- ============================================================

INSERT INTO permissions (resource, action, description)
VALUES (
    'studentProgression',
    'override',
    'Override student promotion criteria with an auditable reason'
)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'studentProgression'
   AND p.action = 'override'
WHERE r.name IN ('Principal', 'Exam Officer')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ============================================================
-- 2. COMPOSITE KEYS FOR SCHOOL-SCOPED RELATIONSHIPS
-- ============================================================

ALTER TABLE academic_levels
ADD CONSTRAINT unique_academic_levels_school_id
UNIQUE (school_id, id);

ALTER TABLE subjects
ADD CONSTRAINT unique_subjects_school_id
UNIQUE (school_id, id);


-- ============================================================
-- 3. PROMOTION CRITERIA CONFIGURATIONS
-- ============================================================

CREATE TABLE student_promotion_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    academic_level_id UUID,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_promotion_criteria_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_promotion_criteria_academic_level
        FOREIGN KEY (school_id, academic_level_id)
        REFERENCES academic_levels (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_promotion_criteria_school_id
        UNIQUE (school_id, id)
);

-- One school-wide default configuration per school.
CREATE UNIQUE INDEX unique_school_default_promotion_criteria
ON student_promotion_criteria (school_id)
WHERE academic_level_id IS NULL;

-- One level-specific configuration per academic level.
CREATE UNIQUE INDEX unique_level_promotion_criteria
ON student_promotion_criteria (school_id, academic_level_id)
WHERE academic_level_id IS NOT NULL;

CREATE INDEX idx_promotion_criteria_school_active
ON student_promotion_criteria (school_id, is_active);


-- ============================================================
-- 4. IMMUTABLE PROMOTION CRITERIA VERSIONS
-- ============================================================

CREATE TABLE student_promotion_criteria_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    criteria_id UUID NOT NULL,

    version_number INTEGER NOT NULL,
    is_sealed BOOLEAN NOT NULL DEFAULT FALSE,

    minimum_session_average NUMERIC(5,2) NOT NULL,
    subject_pass_mark NUMERIC(5,2) NOT NULL,
    minimum_subjects_passed INTEGER NOT NULL,

    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_promotion_criteria_versions_configuration
        FOREIGN KEY (school_id, criteria_id)
        REFERENCES student_promotion_criteria (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_promotion_criteria_versions_creator
        FOREIGN KEY (school_id, created_by)
        REFERENCES users (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_promotion_criteria_version_number
        CHECK (version_number > 0),

    CONSTRAINT valid_minimum_session_average
        CHECK (
            minimum_session_average >= 0
            AND minimum_session_average <= 100
        ),

    CONSTRAINT valid_subject_pass_mark
        CHECK (
            subject_pass_mark >= 0
            AND subject_pass_mark <= 100
        ),

    CONSTRAINT valid_minimum_subjects_passed
        CHECK (minimum_subjects_passed >= 0),

    CONSTRAINT unique_promotion_criteria_version_number
        UNIQUE (criteria_id, version_number),

    CONSTRAINT unique_promotion_criteria_version_school_id
        UNIQUE (school_id, id)
);

CREATE INDEX idx_promotion_criteria_versions_configuration
ON student_promotion_criteria_versions (
    school_id,
    criteria_id,
    version_number DESC
);


-- ============================================================
-- 5. REQUIRED TERMS PER CRITERIA VERSION
-- ============================================================

CREATE TABLE student_promotion_criteria_terms (
    school_id UUID NOT NULL,
    criteria_version_id UUID NOT NULL,

    term_display_order INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_promotion_criteria_terms
        PRIMARY KEY (criteria_version_id, term_display_order),

    CONSTRAINT fk_promotion_criteria_terms_version
        FOREIGN KEY (school_id, criteria_version_id)
        REFERENCES student_promotion_criteria_versions (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_promotion_criteria_term_order
        CHECK (term_display_order > 0)
);


-- ============================================================
-- 6. MANDATORY SUBJECTS PER CRITERIA VERSION
-- ============================================================

CREATE TABLE student_promotion_criteria_subjects (
    school_id UUID NOT NULL,
    criteria_version_id UUID NOT NULL,
    subject_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_promotion_criteria_subjects
        PRIMARY KEY (criteria_version_id, subject_id),

    CONSTRAINT fk_promotion_criteria_subjects_version
        FOREIGN KEY (school_id, criteria_version_id)
        REFERENCES student_promotion_criteria_versions (school_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_promotion_criteria_subjects_subject
        FOREIGN KEY (school_id, subject_id)
        REFERENCES subjects (school_id, id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_promotion_criteria_subjects_subject
ON student_promotion_criteria_subjects (school_id, subject_id);


-- ============================================================
-- 7. PROGRESSION EVALUATION AND DECISION AUDIT
-- ============================================================

-- Existing records are deliberately classified as legacy.
-- They must not be represented as having passed or bypassed
-- promotion criteria that did not exist when they were processed.

ALTER TABLE student_progression_records
ADD COLUMN criteria_version_id UUID,
ADD COLUMN evaluation_status VARCHAR(20),
ADD COLUMN evaluation_snapshot JSONB,
ADD COLUMN recommended_outcome VARCHAR(20),
ADD COLUMN is_override BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN override_reason TEXT,
ADD COLUMN decided_by UUID,
ADD COLUMN decided_at TIMESTAMPTZ;

UPDATE student_progression_records
SET
    evaluation_status = 'legacy',
    evaluation_snapshot = '{}'::JSONB
WHERE evaluation_status IS NULL;

ALTER TABLE student_progression_records
ALTER COLUMN evaluation_status SET NOT NULL;

ALTER TABLE student_progression_records
ALTER COLUMN evaluation_snapshot SET DEFAULT '{}'::JSONB;

ALTER TABLE student_progression_records
ALTER COLUMN evaluation_snapshot SET NOT NULL;

ALTER TABLE student_progression_records
ADD CONSTRAINT fk_progression_records_criteria_version
FOREIGN KEY (school_id, criteria_version_id)
REFERENCES student_promotion_criteria_versions (school_id, id)
ON DELETE RESTRICT;

ALTER TABLE student_progression_records
ADD CONSTRAINT fk_progression_records_decision_user
FOREIGN KEY (school_id, decided_by)
REFERENCES users (school_id, id)
ON DELETE RESTRICT;

ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_evaluation_status
CHECK (
    evaluation_status IN (
        'legacy',
        'eligible',
        'not_eligible',
        'incomplete',
        'not_required'
    )
);

ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_recommended_outcome
CHECK (
    recommended_outcome IS NULL
    OR recommended_outcome = 'promote'
);

ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_evaluation_criteria_reference
CHECK (
    (
        evaluation_status IN ('legacy', 'not_required')
        AND criteria_version_id IS NULL
    )
    OR
    (
        evaluation_status IN (
            'eligible',
            'not_eligible',
            'incomplete'
        )
        AND criteria_version_id IS NOT NULL
    )
);

ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_evaluation_decision
CHECK (
    CASE evaluation_status
        WHEN 'legacy' THEN TRUE

        WHEN 'not_required' THEN
            outcome IN ('graduate', 'transfer', 'withdraw')
            AND recommended_outcome IS NULL

        WHEN 'eligible' THEN
            outcome IN ('promote', 'repeat')
            AND recommended_outcome IS NOT DISTINCT FROM 'promote'

        WHEN 'not_eligible' THEN
            outcome IN ('promote', 'repeat')
            AND recommended_outcome IS NULL

        WHEN 'incomplete' THEN
            outcome IN ('promote', 'repeat')
            AND recommended_outcome IS NULL

        ELSE FALSE
    END
);


ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_override_decision
CHECK (
    CASE
        WHEN evaluation_status = 'legacy' THEN
            is_override = FALSE

        WHEN evaluation_status = 'eligible'
             AND outcome = 'repeat' THEN
            is_override = TRUE

        WHEN evaluation_status = 'not_eligible'
             AND outcome = 'promote' THEN
            is_override = TRUE

        WHEN evaluation_status = 'incomplete'
             AND outcome IN ('promote', 'repeat') THEN
            is_override = TRUE

        ELSE
            is_override = FALSE
    END
);

ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_override_reason
CHECK (
    (
        is_override = FALSE
        AND override_reason IS NULL
    )
    OR
    (
        is_override = TRUE
        AND override_reason IS NOT NULL
        AND LENGTH(TRIM(override_reason)) > 0
    )
);

ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_decision_audit
CHECK (
    (
        evaluation_status = 'legacy'
        AND decided_by IS NULL
        AND decided_at IS NULL
    )
    OR
    (
        evaluation_status <> 'legacy'
        AND decided_by IS NOT NULL
        AND decided_at IS NOT NULL
    )
);

ALTER TABLE student_progression_records
ADD CONSTRAINT valid_progression_evaluation_snapshot
CHECK (
    jsonb_typeof(evaluation_snapshot) = 'object'
);

CREATE INDEX idx_progression_records_criteria_version
ON student_progression_records (school_id, criteria_version_id);

CREATE INDEX idx_progression_records_evaluation_status
ON student_progression_records (school_id, evaluation_status);


-- ============================================================
-- 8. PREVENT CRITERIA CONFIGURATION SCOPE CHANGES
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_used_promotion_criteria_scope_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        NEW.school_id IS DISTINCT FROM OLD.school_id
        OR NEW.academic_level_id IS DISTINCT FROM OLD.academic_level_id
    )
    AND EXISTS (
        SELECT 1
        FROM student_promotion_criteria_versions
        WHERE school_id = OLD.school_id
          AND criteria_id = OLD.id
    ) THEN
        RAISE EXCEPTION
            'Promotion criteria scope cannot change after versions have been created.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_promotion_criteria_scope
BEFORE UPDATE OF school_id, academic_level_id
ON student_promotion_criteria
FOR EACH ROW
EXECUTE FUNCTION prevent_used_promotion_criteria_scope_change();


-- ============================================================
-- 9. PROTECT AND SEAL CRITERIA VERSIONS
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_promotion_criteria_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION
            'Promotion criteria versions cannot be deleted.';
    END IF;

    -- Permit only one change: unsealed to sealed.
    -- Every other version field must remain unchanged.
    IF OLD.is_sealed = TRUE
       OR NEW.is_sealed IS DISTINCT FROM TRUE
       OR (
           to_jsonb(NEW) - 'is_sealed'
       ) IS DISTINCT FROM (
           to_jsonb(OLD) - 'is_sealed'
       ) THEN
        RAISE EXCEPTION
            'Promotion criteria versions are immutable. Only an unsealed version may be sealed.';
    END IF;

    -- A version cannot be sealed without at least one required term.
    IF NOT EXISTS (
        SELECT 1
        FROM student_promotion_criteria_terms
        WHERE criteria_version_id = NEW.id
    ) THEN
        RAISE EXCEPTION
            'A promotion criteria version must contain at least one required term before sealing.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_promotion_criteria_versions
BEFORE UPDATE OR DELETE
ON student_promotion_criteria_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_promotion_criteria_version_mutation();

-- ============================================================
-- 10. PROTECT CRITERIA DETAILS AFTER VERSION SEALING
-- ============================================================

CREATE OR REPLACE FUNCTION protect_promotion_criteria_detail_mutation()
RETURNS TRIGGER AS $$
DECLARE
    old_version_id UUID;
    new_version_id UUID;
    version_record RECORD;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        old_version_id := OLD.criteria_version_id;
    END IF;

    IF TG_OP <> 'DELETE' THEN
        new_version_id := NEW.criteria_version_id;
    END IF;

    -- Lock affected versions in a consistent order.
    FOR version_record IN
        SELECT id, is_sealed
        FROM student_promotion_criteria_versions
        WHERE id IN (old_version_id, new_version_id)
        ORDER BY id
        FOR UPDATE
    LOOP
        IF version_record.is_sealed THEN
            RAISE EXCEPTION
                'Promotion criteria details cannot be changed after their version is sealed.';
        END IF;
    END LOOP;

    -- Prevent moving details between versions if either
    -- version has already been used in progression history.
    IF EXISTS (
        SELECT 1
        FROM student_progression_records
        WHERE criteria_version_id IN (old_version_id, new_version_id)
    ) THEN
        RAISE EXCEPTION
            'Promotion criteria details used in progression history cannot be modified or deleted.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_used_promotion_criteria_terms
BEFORE INSERT OR UPDATE OR DELETE
ON student_promotion_criteria_terms
FOR EACH ROW
EXECUTE FUNCTION protect_promotion_criteria_detail_mutation();

CREATE TRIGGER trg_protect_used_promotion_criteria_subjects
BEFORE INSERT OR UPDATE OR DELETE
ON student_promotion_criteria_subjects
FOR EACH ROW
EXECUTE FUNCTION protect_promotion_criteria_detail_mutation();

-- ============================================================
-- 11. SERIALIZE PROGRESSION RECORD USE OF CRITERIA VERSIONS
-- ============================================================

CREATE OR REPLACE FUNCTION lock_progression_criteria_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.criteria_version_id IS NOT NULL THEN
        PERFORM id
        FROM student_promotion_criteria_versions
        WHERE id = NEW.criteria_version_id
          AND school_id = NEW.school_id
          AND is_sealed = TRUE
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'The selected promotion criteria version does not exist for this school or has not been sealed.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_progression_criteria_version
BEFORE INSERT OR UPDATE OF criteria_version_id
ON student_progression_records
FOR EACH ROW
EXECUTE FUNCTION lock_progression_criteria_version();


-- ============================================================
-- 12. PROTECT PROGRESSION EVALUATION AND DECISION AUDIT
-- ============================================================

-- Audit fields cannot be changed after a progression record
-- is created. Unrelated updates are not blocked when the audit
-- values remain exactly the same.

CREATE OR REPLACE FUNCTION prevent_progression_evaluation_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION
            'Progression history records cannot be deleted.';
    END IF;

    IF
        NEW.criteria_version_id IS DISTINCT FROM OLD.criteria_version_id
        OR NEW.evaluation_status IS DISTINCT FROM OLD.evaluation_status
        OR NEW.evaluation_snapshot IS DISTINCT FROM OLD.evaluation_snapshot
        OR NEW.recommended_outcome IS DISTINCT FROM OLD.recommended_outcome
        OR NEW.is_override IS DISTINCT FROM OLD.is_override
        OR NEW.override_reason IS DISTINCT FROM OLD.override_reason
        OR NEW.decided_by IS DISTINCT FROM OLD.decided_by
        OR NEW.decided_at IS DISTINCT FROM OLD.decided_at
    THEN
        RAISE EXCEPTION
            'Progression evaluation and decision audit records are immutable.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_progression_evaluation_audit
BEFORE UPDATE OF
    criteria_version_id,
    evaluation_status,
    evaluation_snapshot,
    recommended_outcome,
    is_override,
    override_reason,
    decided_by,
    decided_at
ON student_progression_records
FOR EACH ROW
EXECUTE FUNCTION prevent_progression_evaluation_audit_mutation();

CREATE TRIGGER trg_prevent_progression_record_deletion
BEFORE DELETE
ON student_progression_records
FOR EACH ROW
EXECUTE FUNCTION prevent_progression_evaluation_audit_mutation();


COMMIT;

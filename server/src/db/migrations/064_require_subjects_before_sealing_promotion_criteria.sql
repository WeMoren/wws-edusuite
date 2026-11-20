BEGIN;

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

    -- A version cannot be sealed without at least one required subject.
    IF NOT EXISTS (
        SELECT 1
        FROM student_promotion_criteria_subjects
        WHERE criteria_version_id = NEW.id
    ) THEN
        RAISE EXCEPTION
            'A promotion criteria version must contain at least one required subject before sealing.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

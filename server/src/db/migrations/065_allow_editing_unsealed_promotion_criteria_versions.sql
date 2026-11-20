BEGIN;

CREATE OR REPLACE FUNCTION prevent_promotion_criteria_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- Promotion criteria versions must never be deleted.
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION
            'Promotion criteria versions cannot be deleted.';
    END IF;

    -- Once sealed, a version cannot be changed again.
    IF OLD.is_sealed = TRUE THEN
        RAISE EXCEPTION
            'Sealed promotion criteria versions are immutable.';
    END IF;

    -- Only an unsealed draft may be updated.
    IF NEW.is_sealed IS DISTINCT FROM FALSE
       AND NEW.is_sealed IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION
            'Invalid promotion criteria version state.';
    END IF;

    -- Sealing is a separate operation. No other field may change
    -- during the unsealed-to-sealed transition.
    IF NEW.is_sealed = TRUE THEN
        IF (
            to_jsonb(NEW) - 'is_sealed'
        ) IS DISTINCT FROM (
            to_jsonb(OLD) - 'is_sealed'
        ) THEN
            RAISE EXCEPTION
                'A promotion criteria version cannot be edited while sealing.';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM student_promotion_criteria_terms
            WHERE school_id = NEW.school_id
              AND criteria_version_id = NEW.id
        ) THEN
            RAISE EXCEPTION
                'A promotion criteria version must contain at least one required term before sealing.';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM student_promotion_criteria_subjects
            WHERE school_id = NEW.school_id
              AND criteria_version_id = NEW.id
        ) THEN
            RAISE EXCEPTION
                'A promotion criteria version must contain at least one required subject before sealing.';
        END IF;

    ELSE
        -- While the version remains an unsealed draft, only its
        -- threshold values may change. All identity and audit fields
        -- remain protected.
        IF (
            to_jsonb(NEW)
                - 'is_sealed'
                - 'minimum_session_average'
                - 'subject_pass_mark'
                - 'minimum_subjects_passed'
        ) IS DISTINCT FROM (
            to_jsonb(OLD)
                - 'is_sealed'
                - 'minimum_session_average'
                - 'subject_pass_mark'
                - 'minimum_subjects_passed'
        ) THEN
            RAISE EXCEPTION
                'Only draft threshold values may be changed.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

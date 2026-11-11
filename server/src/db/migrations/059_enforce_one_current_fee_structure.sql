BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM fee_structures
        WHERE is_current = TRUE
        GROUP BY
            school_id,
            academic_session_id,
            term_id,
            academic_level_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot enforce one current fee structure: duplicate current structures exist for one or more school/session/term/academic-level combinations. Resolve these conflicts before applying migration 059.';
    END IF;
END;
$$;

CREATE UNIQUE INDEX unique_current_fee_structure_per_level
ON fee_structures (
    school_id,
    academic_session_id,
    term_id,
    academic_level_id
)
WHERE is_current = TRUE;

COMMIT;

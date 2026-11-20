BEGIN;

ALTER TABLE academic_levels
ADD COLUMN requires_subject_combination BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

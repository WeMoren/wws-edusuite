BEGIN;

ALTER TABLE result_documents
ADD COLUMN IF NOT EXISTS total_subjects_offered INTEGER;

COMMIT;

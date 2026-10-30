ALTER TABLE schools
ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN schools.website IS
'Official website URL for the school';

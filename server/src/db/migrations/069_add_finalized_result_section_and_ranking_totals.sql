ALTER TABLE result_documents
ADD COLUMN section_name VARCHAR(100),
ADD COLUMN class_position_total INTEGER,
ADD COLUMN academic_level_position_total INTEGER,
ADD COLUMN session_academic_level_position_total INTEGER;

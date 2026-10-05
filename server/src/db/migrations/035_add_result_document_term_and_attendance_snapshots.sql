ALTER TABLE result_documents
ADD COLUMN term_total_score NUMERIC(7,2),
ADD COLUMN term_average NUMERIC(5,2),
ADD COLUMN term_grade VARCHAR(10),
ADD COLUMN term_remark VARCHAR(100),
ADD COLUMN class_position INTEGER,
ADD COLUMN academic_level_position INTEGER,
ADD COLUMN attendance_present INTEGER,
ADD COLUMN attendance_absent INTEGER,
ADD COLUMN attendance_total_marked INTEGER,
ADD COLUMN attendance_percentage NUMERIC(5,2);

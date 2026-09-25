ALTER TABLE student_enrollments
ADD COLUMN stream_id UUID,
ADD COLUMN subject_combination_id UUID;

ALTER TABLE student_enrollments
ADD CONSTRAINT student_enrollments_stream_fk
    FOREIGN KEY (stream_id)
    REFERENCES streams(id)
    ON DELETE RESTRICT;

ALTER TABLE student_enrollments
ADD CONSTRAINT student_enrollments_subject_combination_fk
    FOREIGN KEY (subject_combination_id)
    REFERENCES subject_combinations(id)
    ON DELETE RESTRICT;

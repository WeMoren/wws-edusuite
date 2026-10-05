ALTER TABLE result_documents
ADD CONSTRAINT unique_result_document_per_student_term
UNIQUE (
    school_id,
    student_enrollment_id,
    term_id
);
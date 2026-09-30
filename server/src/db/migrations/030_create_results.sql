CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    student_enrollment_id UUID NOT NULL,
    term_id UUID NOT NULL,
    subject_id UUID NOT NULL,

    ca NUMERIC(5,2) NOT NULL DEFAULT 0,
    exam NUMERIC(5,2) NOT NULL DEFAULT 0,
    total NUMERIC(5,2) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    remark VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_results_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_results_enrollment
        FOREIGN KEY (student_enrollment_id)
        REFERENCES student_enrollments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_results_term
        FOREIGN KEY (term_id)
        REFERENCES terms(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_results_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_result_per_enrollment_term_subject
        UNIQUE (student_enrollment_id, term_id, subject_id),

    CONSTRAINT valid_result_ca
        CHECK (ca >= 0 AND ca <= 30),

    CONSTRAINT valid_result_exam
        CHECK (exam >= 0 AND exam <= 70),

    CONSTRAINT valid_result_total
        CHECK (
            total >= 0
            AND total <= 100
            AND total = ca + exam
        )
);


CREATE TABLE result_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    student_enrollment_id UUID NOT NULL,
    term_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    school_name VARCHAR(150) NOT NULL,
    school_email VARCHAR(255) NOT NULL,
    school_phone VARCHAR(30),
    school_address TEXT,
    school_logo_url TEXT,

    student_name VARCHAR(150) NOT NULL,
    admission_number VARCHAR(100),
    gender VARCHAR(20),

    academic_session_name VARCHAR(100) NOT NULL,
    term_name VARCHAR(50) NOT NULL,
    academic_level_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(100) NOT NULL,

    stream_name VARCHAR(100),
    subject_combination_name VARCHAR(100),

    principal_name VARCHAR(150),
    principal_title VARCHAR(150),
    principal_signature_url TEXT,
    principal_stamp_url TEXT,

    exam_officer_name VARCHAR(150),
    exam_officer_title VARCHAR(150),
    exam_officer_signature_url TEXT,
    exam_officer_stamp_url TEXT,

    finalized_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_result_documents_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_result_documents_enrollment
        FOREIGN KEY (student_enrollment_id)
        REFERENCES student_enrollments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_result_documents_term
        FOREIGN KEY (term_id)
        REFERENCES terms(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_result_document_per_enrollment_term
        UNIQUE (student_enrollment_id, term_id),

    CONSTRAINT valid_result_document_status
        CHECK (
            status IN (
                'draft',
                'finalized'
            )
        )
);


CREATE INDEX idx_results_school_id
    ON results (school_id);

CREATE INDEX idx_results_enrollment_id
    ON results (student_enrollment_id);

CREATE INDEX idx_results_term_id
    ON results (term_id);

CREATE INDEX idx_results_subject_id
    ON results (subject_id);

CREATE INDEX idx_result_documents_school_id
    ON result_documents (school_id);

CREATE INDEX idx_result_documents_enrollment_id
    ON result_documents (student_enrollment_id);

CREATE INDEX idx_result_documents_term_id
    ON result_documents (term_id);

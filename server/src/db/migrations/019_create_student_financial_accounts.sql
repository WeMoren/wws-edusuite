CREATE TABLE student_financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    student_id UUID NOT NULL,
    enrollment_id UUID NOT NULL,
    academic_session_id UUID NOT NULL,
    term_id UUID NOT NULL,
    fee_structure_id UUID NOT NULL,

    total_due NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'unpaid',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_student_financial_accounts_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_financial_accounts_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_financial_accounts_enrollment
        FOREIGN KEY (enrollment_id)
        REFERENCES student_enrollments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_financial_accounts_academic_session
        FOREIGN KEY (academic_session_id)
        REFERENCES academic_sessions(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_financial_accounts_term
        FOREIGN KEY (term_id)
        REFERENCES terms(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_financial_accounts_fee_structure
        FOREIGN KEY (fee_structure_id)
        REFERENCES fee_structures(id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_student_financial_account_total_due
        CHECK (total_due >= 0),

    CONSTRAINT valid_student_financial_account_total_paid
        CHECK (total_paid >= 0),

        CONSTRAINT valid_student_financial_account_paid_amount
    CHECK (total_paid <= total_due),

    CONSTRAINT valid_student_financial_account_status
        CHECK (status IN ('unpaid', 'partially_paid', 'paid')),

    CONSTRAINT unique_student_financial_account
        UNIQUE (
            student_id,
            enrollment_id,
            term_id
        )
);
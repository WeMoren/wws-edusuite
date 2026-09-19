CREATE SEQUENCE payment_receipt_number_seq
    START WITH 1
    INCREMENT BY 1;

CREATE TABLE payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    payment_id UUID NOT NULL,

    receipt_number BIGINT NOT NULL,

    school_name VARCHAR(150) NOT NULL,
    school_email VARCHAR(255) NOT NULL,
    school_phone VARCHAR(30),
    school_address TEXT,
    school_logo_url TEXT,

    student_id UUID NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    admission_number VARCHAR(100),
    gender VARCHAR(20),

    academic_session_id UUID NOT NULL,
    academic_session_name VARCHAR(100) NOT NULL,

    term_id UUID NOT NULL,
    term_name VARCHAR(50) NOT NULL,

    academic_level_id UUID NOT NULL,
    academic_level_name VARCHAR(100) NOT NULL,

    class_id UUID NOT NULL,
    class_name VARCHAR(100) NOT NULL,

    financial_account_id UUID NOT NULL,

    total_due NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL,
    total_paid_after_payment NUMERIC(12,2) NOT NULL,
    outstanding_balance_after_payment NUMERIC(12,2) NOT NULL,

    payment_date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_reference VARCHAR(100),
    payment_description TEXT,

    principal_name VARCHAR(150),
    principal_title VARCHAR(150),
    principal_signature_url TEXT,
    principal_stamp_url TEXT,

    accounting_officer_name VARCHAR(150),
    accounting_officer_title VARCHAR(150),
    accounting_officer_signature_url TEXT,
    accounting_officer_stamp_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payment_receipts_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_receipts_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_receipts_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_receipts_academic_session
        FOREIGN KEY (academic_session_id)
        REFERENCES academic_sessions(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_receipts_term
        FOREIGN KEY (term_id)
        REFERENCES terms(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_receipts_academic_level
        FOREIGN KEY (academic_level_id)
        REFERENCES academic_levels(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_receipts_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_receipts_financial_account
        FOREIGN KEY (financial_account_id)
        REFERENCES student_financial_accounts(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_payment_receipt_payment
        UNIQUE (payment_id),

    CONSTRAINT unique_payment_receipt_number
        UNIQUE (school_id, receipt_number),

    CONSTRAINT valid_payment_receipt_total_due
        CHECK (total_due >= 0),

    CONSTRAINT valid_payment_receipt_amount_paid
        CHECK (amount_paid > 0),

    CONSTRAINT valid_payment_receipt_total_paid
        CHECK (total_paid_after_payment >= amount_paid),

    CONSTRAINT valid_payment_receipt_outstanding_balance
        CHECK (outstanding_balance_after_payment >= 0),

    CONSTRAINT valid_payment_receipt_payment_method
        CHECK (
            payment_method IN (
                'cash',
                'transfer',
                'pos',
                'cheque',
                'ussd',
                'other'
            )
        )
);

CREATE TABLE payment_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payment_receipt_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    display_order INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payment_receipt_items_receipt
        FOREIGN KEY (payment_receipt_id)
        REFERENCES payment_receipts(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_payment_receipt_item_amount
        CHECK (amount >= 0),

    CONSTRAINT valid_payment_receipt_item_display_order
        CHECK (display_order > 0),

    CONSTRAINT unique_payment_receipt_item_name
        UNIQUE (payment_receipt_id, name),

    CONSTRAINT unique_payment_receipt_item_display_order
        UNIQUE (payment_receipt_id, display_order)
);

CREATE INDEX idx_payment_receipts_school_id
    ON payment_receipts (school_id);

CREATE INDEX idx_payment_receipts_student_id
    ON payment_receipts (student_id);

CREATE INDEX idx_payment_receipts_payment_date
    ON payment_receipts (school_id, payment_date);

CREATE INDEX idx_payment_receipt_items_receipt_id
    ON payment_receipt_items (payment_receipt_id);
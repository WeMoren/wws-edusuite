CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    student_id UUID NOT NULL,
    financial_account_id UUID NOT NULL,

    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL,

    payment_method VARCHAR(30) NOT NULL,
    reference VARCHAR(100),
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payments_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payments_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payments_financial_account
        FOREIGN KEY (financial_account_id)
        REFERENCES student_financial_accounts(id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_payment_amount
        CHECK (amount > 0),

    CONSTRAINT valid_payment_method
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
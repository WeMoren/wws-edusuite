CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_expense_categories_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_expense_category_name
        UNIQUE (school_id, name)
);


CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    expense_category_id UUID NOT NULL,
    expense_category_name VARCHAR(100) NOT NULL,

    amount NUMERIC(12,2) NOT NULL,
    expense_date DATE NOT NULL,

    payment_method VARCHAR(30) NOT NULL,

    reference VARCHAR(100),
    description TEXT,

    created_by UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_expenses_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_expenses_category
        FOREIGN KEY (expense_category_id)
        REFERENCES expense_categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_expenses_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_expense_amount
        CHECK (amount > 0),

    CONSTRAINT valid_expense_payment_method
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


CREATE INDEX idx_expense_categories_school
    ON expense_categories(school_id);


CREATE INDEX idx_expenses_school_date
    ON expenses(school_id, expense_date);


CREATE INDEX idx_expenses_school_category
    ON expenses(school_id, expense_category_id);


CREATE INDEX idx_expenses_created_by
    ON expenses(created_by);
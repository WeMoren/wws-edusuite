CREATE TABLE school_officials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    official_type VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    title VARCHAR(150) NOT NULL,
    signature_url TEXT,
    stamp_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_school_officials_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_school_official_type
        CHECK (
            official_type IN (
                'principal',
                'exam_officer',
                'accounting_officer'
            )
        ),

    CONSTRAINT unique_school_official_type
        UNIQUE (school_id, official_type)
);
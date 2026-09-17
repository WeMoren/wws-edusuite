CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    academic_session_id UUID NOT NULL,
    term_id UUID NOT NULL,
    academic_level_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_fee_structures_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_fee_structures_academic_session
        FOREIGN KEY (academic_session_id)
        REFERENCES academic_sessions(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_fee_structures_term
        FOREIGN KEY (term_id)
        REFERENCES terms(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_fee_structures_academic_level
        FOREIGN KEY (academic_level_id)
        REFERENCES academic_levels(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_fee_structure_name
        UNIQUE (
            school_id,
            academic_session_id,
            term_id,
            academic_level_id,
            name
        )
);


CREATE TABLE fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fee_structure_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,

    display_order INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_fee_structure_items_fee_structure
        FOREIGN KEY (fee_structure_id)
        REFERENCES fee_structures(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_fee_structure_item_amount
        CHECK (amount >= 0),

    CONSTRAINT valid_fee_structure_item_display_order
        CHECK (display_order > 0),

    CONSTRAINT unique_fee_structure_item_name
        UNIQUE (fee_structure_id, name),

    CONSTRAINT unique_fee_structure_item_display_order
        UNIQUE (fee_structure_id, display_order)
);
CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    academic_session_id UUID NOT NULL,

    name VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_terms_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_terms_academic_session
        FOREIGN KEY (academic_session_id)
        REFERENCES academic_sessions(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_term_per_academic_session
        UNIQUE (academic_session_id, name),

    CONSTRAINT valid_term_display_order
        CHECK (display_order > 0),

    CONSTRAINT valid_term_dates
        CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX unique_current_term_per_academic_session
    ON terms (academic_session_id)
    WHERE is_current = TRUE;
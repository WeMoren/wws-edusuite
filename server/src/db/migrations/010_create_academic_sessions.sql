CREATE TABLE academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    name VARCHAR(20) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_academic_sessions_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_academic_session_name_per_school
        UNIQUE (school_id, name),

    CONSTRAINT valid_academic_session_dates
        CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX unique_current_academic_session_per_school
    ON academic_sessions (school_id)
    WHERE is_current = TRUE;
CREATE TABLE academic_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_academic_levels_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_academic_level_name_per_school
        UNIQUE (school_id, name),

    CONSTRAINT valid_academic_level_display_order
        CHECK (display_order > 0)
);
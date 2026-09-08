CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    class_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    class_teacher_id UUID,
    room VARCHAR(100),
    capacity INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sections_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sections_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_sections_class_teacher
        FOREIGN KEY (class_teacher_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT unique_section_per_class
        UNIQUE (class_id, name),

    CONSTRAINT valid_section_capacity
        CHECK (capacity IS NULL OR capacity > 0)
);
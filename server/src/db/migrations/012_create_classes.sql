CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    academic_session_id UUID NOT NULL,
    academic_level_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_classes_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_classes_academic_session
        FOREIGN KEY (academic_session_id)
        REFERENCES academic_sessions(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_classes_academic_level
        FOREIGN KEY (academic_level_id)
        REFERENCES academic_levels(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_class_per_school_session_level
        UNIQUE (
            school_id,
            academic_session_id,
            academic_level_id,
            name
        )
);
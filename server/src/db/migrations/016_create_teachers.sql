CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    user_id UUID NOT NULL,

    staff_id VARCHAR(50) NOT NULL,

    subject VARCHAR(100) NOT NULL,

    gender VARCHAR(20) NOT NULL
        CHECK (gender IN ('Male', 'Female')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_teachers_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_teachers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_teacher_user_per_school
        UNIQUE (school_id, user_id),

    CONSTRAINT unique_teacher_staff_id_per_school
        UNIQUE (school_id, staff_id)
);
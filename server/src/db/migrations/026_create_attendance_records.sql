CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    enrollment_id UUID NOT NULL
        REFERENCES student_enrollments(id)
        ON DELETE CASCADE,

    academic_term_id UUID NOT NULL
        REFERENCES terms(id)
        ON DELETE CASCADE,

    attendance_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('present', 'absent')),

    created_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_attendance_per_day
        UNIQUE (enrollment_id, academic_term_id, attendance_date)
);
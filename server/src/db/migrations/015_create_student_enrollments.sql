CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    student_id UUID NOT NULL,
    academic_session_id UUID NOT NULL,
    class_id UUID NOT NULL,
    section_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'completed',
                'withdrawn',
                'transferred'
            )
        ),

    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_student_enrollments_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_enrollments_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_enrollments_academic_session
        FOREIGN KEY (academic_session_id)
        REFERENCES academic_sessions(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_enrollments_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_enrollments_section
        FOREIGN KEY (section_id)
        REFERENCES sections(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_student_enrollment_per_session
        UNIQUE (student_id, academic_session_id)
);
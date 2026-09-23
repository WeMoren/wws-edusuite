CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    code VARCHAR(50) NOT NULL,

    category VARCHAR(50) NOT NULL
        CHECK (
            category IN (
                'Core',
                'Science',
                'Art',
                'Commercial',
                'Humanities',
                'Language',
                'Vocational',
                'Other'
            )
        ),

    is_core BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_subject_name_per_school
        UNIQUE (school_id, name),

    CONSTRAINT unique_subject_code_per_school
        UNIQUE (school_id, code)
);


CREATE TABLE subject_academic_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    subject_id UUID NOT NULL
        REFERENCES subjects(id)
        ON DELETE CASCADE,

    academic_level_id UUID NOT NULL
        REFERENCES academic_levels(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_subject_academic_level
        UNIQUE (subject_id, academic_level_id)
);


CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    code VARCHAR(50) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_stream_name_per_school
        UNIQUE (school_id, name),

    CONSTRAINT unique_stream_code_per_school
        UNIQUE (school_id, code)
);


CREATE TABLE stream_academic_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    stream_id UUID NOT NULL
        REFERENCES streams(id)
        ON DELETE CASCADE,

    academic_level_id UUID NOT NULL
        REFERENCES academic_levels(id)
        ON DELETE CASCADE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_stream_academic_level
        UNIQUE (stream_id, academic_level_id)
);


CREATE TABLE subject_combinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_level_id UUID NOT NULL
        REFERENCES academic_levels(id)
        ON DELETE CASCADE,

    stream_id UUID NOT NULL
        REFERENCES streams(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    code VARCHAR(50) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_subject_combination_name
        UNIQUE (
            school_id,
            academic_level_id,
            stream_id,
            name
        ),

    CONSTRAINT unique_subject_combination_code
        UNIQUE (
            school_id,
            academic_level_id,
            stream_id,
            code
        )
);


CREATE TABLE subject_combination_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    subject_combination_id UUID NOT NULL
        REFERENCES subject_combinations(id)
        ON DELETE CASCADE,

    subject_id UUID NOT NULL
        REFERENCES subjects(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_subject_combination_subject
        UNIQUE (
            subject_combination_id,
            subject_id
        )
);

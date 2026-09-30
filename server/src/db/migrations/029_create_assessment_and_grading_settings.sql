CREATE TABLE assessment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    ca_max NUMERIC(5,2) NOT NULL DEFAULT 30,
    exam_max NUMERIC(5,2) NOT NULL DEFAULT 70,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_assessment_settings_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_assessment_settings_per_school
        UNIQUE (school_id),

    CONSTRAINT valid_assessment_ca_max
        CHECK (ca_max >= 0 AND ca_max <= 100),

    CONSTRAINT valid_assessment_exam_max
        CHECK (exam_max >= 0 AND exam_max <= 100),

    CONSTRAINT valid_assessment_total
        CHECK (ca_max + exam_max = 100)
);


CREATE TABLE grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    min_score NUMERIC(5,2) NOT NULL,
    max_score NUMERIC(5,2) NOT NULL,

    grade VARCHAR(10) NOT NULL,
    remark VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_grading_scales_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_grading_min_score
        CHECK (min_score >= 0 AND min_score <= 100),

    CONSTRAINT valid_grading_max_score
        CHECK (max_score >= 0 AND max_score <= 100),

    CONSTRAINT valid_grading_score_range
        CHECK (min_score <= max_score),

    CONSTRAINT valid_grading_grade
        CHECK (TRIM(grade) <> ''),

    CONSTRAINT valid_grading_remark
        CHECK (TRIM(remark) <> '')
);


CREATE INDEX idx_assessment_settings_school_id
    ON assessment_settings (school_id);

CREATE INDEX idx_grading_scales_school_id
    ON grading_scales (school_id);

CREATE INDEX idx_grading_scales_score_range
    ON grading_scales (school_id, min_score, max_score);

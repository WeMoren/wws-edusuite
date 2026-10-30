
BEGIN;

-- Store parents and guardians within their own school.
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_parents_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    -- Required for the composite relationship foreign key.
    CONSTRAINT unique_parents_school_id
        UNIQUE (school_id, id)
);

CREATE INDEX idx_parents_school
    ON parents (school_id);

    -- Allow foreign keys to enforce same-school student relationships.
ALTER TABLE students
    ADD CONSTRAINT unique_students_school_id_id
    UNIQUE (school_id, id);

CREATE TABLE parent_student_relationships (
    school_id UUID NOT NULL,
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,

    relationship VARCHAR(50) NOT NULL DEFAULT 'Guardian',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_parent_student_relationships
        PRIMARY KEY (school_id, parent_id, student_id),

    CONSTRAINT fk_parent_student_parent
        FOREIGN KEY (school_id, parent_id)
        REFERENCES parents(school_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_parent_student_student
        FOREIGN KEY (school_id, student_id)
        REFERENCES students(school_id, id)
        ON DELETE CASCADE
);

CREATE INDEX idx_parent_student_student
    ON parent_student_relationships (school_id, student_id);

-- Register the Parents permissions.
INSERT INTO permissions (resource, action, description)
VALUES
    ('parents', 'view', 'View parents and guardians'),
    ('parents', 'create', 'Create parents and guardians'),
    ('parents', 'edit', 'Edit parents and guardians'),
    ('parents', 'delete', 'Delete parents and guardians')
ON CONFLICT DO NOTHING;

-- Give Principal these permissions. School Admin receives none here.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'parents'
WHERE r.name = 'Principal'
ON CONFLICT DO NOTHING;

COMMIT;

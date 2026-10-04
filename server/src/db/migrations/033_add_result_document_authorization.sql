INSERT INTO permissions (
    resource,
    action,
    description
)
VALUES (
    'results',
    'authorize',
    'Authorize result documents'
);

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'results'
   AND p.action = 'authorize'
WHERE r.name IN ('Admin', 'Exam Officer');


ALTER TABLE result_documents
ADD COLUMN principal_authorized_at TIMESTAMPTZ,
ADD COLUMN principal_authorized_by UUID,
ADD COLUMN exam_officer_authorized_at TIMESTAMPTZ,
ADD COLUMN exam_officer_authorized_by UUID;


ALTER TABLE result_documents
ADD CONSTRAINT fk_result_documents_principal_authorized_by
    FOREIGN KEY (principal_authorized_by)
    REFERENCES users(id)
    ON DELETE SET NULL;


ALTER TABLE result_documents
ADD CONSTRAINT fk_result_documents_exam_officer_authorized_by
    FOREIGN KEY (exam_officer_authorized_by)
    REFERENCES users(id)
    ON DELETE SET NULL;
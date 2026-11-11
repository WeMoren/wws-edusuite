BEGIN;

INSERT INTO permissions (resource, action, description)
VALUES (
    'result_document_settings',
    'view',
    'View school details required for result document generation'
)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'result_document_settings'
   AND p.action = 'view'
WHERE r.name = 'Exam Officer'
ON CONFLICT DO NOTHING;

COMMIT;

BEGIN;

-- Grant Exam Officer full Academic Setup access.
-- This includes Result Settings management.
-- Does not grant general Settings access.

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'academicSetup'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name = 'Exam Officer'
ON CONFLICT DO NOTHING;

COMMIT;

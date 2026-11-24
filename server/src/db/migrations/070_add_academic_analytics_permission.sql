BEGIN;

-- Add the dedicated permission for read-only academic analytics.
INSERT INTO permissions (resource, action, description)
VALUES (
    'academicAnalytics',
    'view',
    'View aggregated academic performance analytics'
)
ON CONFLICT (resource, action) DO NOTHING;

-- Grant academic analytics access to School Admin and Exam Officer.
-- Principal already has full operational access through permissionMiddleware.
-- Head Teacher access is verified separately through an active staff-position assignment.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'academicAnalytics'
   AND p.action = 'view'
WHERE r.name IN ('School Admin', 'Exam Officer')
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

BEGIN;

-- Add the permission required for result document authorization.
INSERT INTO permissions (resource, action, description)
VALUES (
    'results',
    'authorize',
    'Authorize result documents as Principal or Exam Officer'
)
ON CONFLICT (resource, action) DO NOTHING;

-- Grant result authorization to Exam Officers only.
-- Principal already has full operational access through permissionMiddleware.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'results'
   AND p.action = 'authorize'
WHERE r.name = 'Exam Officer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

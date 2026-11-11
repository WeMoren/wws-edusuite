BEGIN;

-- Grant School Admin view, create and edit access to Students.
-- Student deletion remains restricted.

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'students'
   AND p.action IN ('view', 'create', 'edit')
WHERE r.name = 'School Admin'
ON CONFLICT DO NOTHING;

COMMIT;

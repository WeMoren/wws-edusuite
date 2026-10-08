INSERT INTO permissions (
    resource,
    action,
    description
)
VALUES
    ('staff', 'view', 'View school staff'),
    ('staff', 'create', 'Create school staff'),
    ('staff', 'edit', 'Edit school staff'),
    ('staff', 'delete', 'Delete school staff');

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'staff'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name = 'Principal';

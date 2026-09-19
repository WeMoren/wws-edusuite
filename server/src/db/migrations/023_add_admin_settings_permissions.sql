INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'settings'
WHERE r.name = 'Admin'
  AND p.action IN ('create', 'edit', 'delete')
ON CONFLICT DO NOTHING;
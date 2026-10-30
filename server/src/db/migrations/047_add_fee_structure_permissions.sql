BEGIN;

-- Keep fee-structure configuration separate from general academic setup.
INSERT INTO permissions (resource, action, description)
VALUES
    ('feeStructures', 'view', 'View school fee structures'),
    ('feeStructures', 'create', 'Create school fee structures'),
    ('feeStructures', 'edit', 'Edit school fee structures'),
    ('feeStructures', 'delete', 'Delete school fee structures')
ON CONFLICT (resource, action) DO NOTHING;

-- Grant fee-structure management to the Principal and School Admin only.
-- The Principal's school-scoped full-access middleware remains unchanged.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'feeStructures'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name IN ('Principal', 'School Admin')
ON CONFLICT DO NOTHING;

COMMIT;

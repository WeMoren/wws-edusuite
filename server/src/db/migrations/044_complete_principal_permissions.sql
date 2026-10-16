BEGIN;

-- Give Principal every currently defined permission for school operations.
-- This does not grant access to global Developer Control Panel operations.
INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource IN (
        'students',
        'teachers',
        'classes',
        'sections',
        'academicSetup',
        'attendance',
        'results',
        'accountant',
        'settings',
        'staff'
    )
WHERE r.name = 'Principal'
ON CONFLICT DO NOTHING;

COMMIT;

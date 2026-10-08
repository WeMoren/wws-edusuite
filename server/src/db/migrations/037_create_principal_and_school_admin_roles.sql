BEGIN;

-- Rename the existing Admin role to School Admin.
UPDATE roles
SET
    name = 'School Admin',
    description = 'Manages school configuration, academic setup, settings, and administrative functions.'
WHERE name = 'Admin';

-- Create the Principal role.
INSERT INTO roles (
    name,
    description
)
VALUES (
    'Principal',
    'Provides school leadership and oversees academic and operational activities.'
)
ON CONFLICT (name) DO NOTHING;

-- Rebuild the renamed School Admin permissions.
DELETE FROM role_permissions
WHERE role_id = (
    SELECT id
    FROM roles
    WHERE name = 'School Admin'
);

-- School Admin: full Academic Setup and Settings access.
INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON (
        p.resource = 'academicSetup'
        AND p.action IN ('view', 'create', 'edit', 'delete')
    )
    OR (
        p.resource = 'settings'
        AND p.action IN ('view', 'create', 'edit', 'delete')
    )
WHERE r.name = 'School Admin';

-- Rebuild Principal permissions.
DELETE FROM role_permissions
WHERE role_id = (
    SELECT id
    FROM roles
    WHERE name = 'Principal'
);

-- Principal: full Academic Setup access.
INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'academicSetup'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name = 'Principal';

-- Principal: full student access.
INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'students'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name = 'Principal';

-- Principal: full teacher access.
INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'teachers'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name = 'Principal';

-- Principal: full attendance access.
INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'attendance'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name = 'Principal';

-- Principal: results oversight and authorization.
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
   AND p.action IN ('view', 'download', 'authorize')
WHERE r.name = 'Principal';

COMMIT;

BEGIN;

-- Upcoming Events permissions.
INSERT INTO permissions (resource, action, description)
VALUES
    ('events', 'view', 'View school upcoming events'),
    ('events', 'create', 'Create school upcoming events'),
    ('events', 'edit', 'Edit school upcoming events'),
    ('events', 'delete', 'Delete school upcoming events'),

    ('recent_activities', 'view', 'View recent school activities')
ON CONFLICT (resource, action) DO NOTHING;

-- Grant full Upcoming Events access to School Admin and Teacher.
-- The Teacher login role is used by invited Head Teachers.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'events'
   AND p.action IN ('view', 'create', 'edit', 'delete')
WHERE r.name IN ('School Admin', 'Teacher')
ON CONFLICT DO NOTHING;

-- Grant read-only Recent Activities access to dashboard roles.
-- Principal access continues through the existing permission middleware bypass.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'recent_activities'
   AND p.action = 'view'
WHERE r.name IN (
    'School Admin',
    'Exam Officer',
    'Teacher',
    'Accountant'
)
ON CONFLICT DO NOTHING;

COMMIT;

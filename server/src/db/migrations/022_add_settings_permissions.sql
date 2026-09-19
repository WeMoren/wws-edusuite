INSERT INTO permissions (resource, action, description)
VALUES
    ('settings', 'create', 'Create settings records'),
    ('settings', 'edit', 'Edit settings records'),
    ('settings', 'delete', 'Delete settings records')
ON CONFLICT (resource, action) DO NOTHING;
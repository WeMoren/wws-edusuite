INSERT INTO permissions (resource, action, description)
VALUES
    ('students', 'view', 'View students'),
    ('students', 'create', 'Create students'),
    ('students', 'edit', 'Edit students'),
    ('students', 'delete', 'Delete students'),

    ('teachers', 'view', 'View teachers'),
    ('teachers', 'create', 'Create teachers'),
    ('teachers', 'edit', 'Edit teachers'),
    ('teachers', 'delete', 'Delete teachers'),

    ('classes', 'view', 'View classes'),
    ('classes', 'create', 'Create classes'),
    ('classes', 'edit', 'Edit classes'),
    ('classes', 'delete', 'Delete classes'),

    ('sections', 'view', 'View sections'),
    ('sections', 'create', 'Create sections'),
    ('sections', 'edit', 'Edit sections'),
    ('sections', 'delete', 'Delete sections'),

    ('academicSetup', 'view', 'View academic setup'),
    ('academicSetup', 'create', 'Create academic setup records'),
    ('academicSetup', 'edit', 'Edit academic setup records'),
    ('academicSetup', 'delete', 'Delete academic setup records'),

    ('attendance', 'view', 'View attendance'),
    ('attendance', 'create', 'Create attendance records'),
    ('attendance', 'edit', 'Edit attendance records'),
    ('attendance', 'delete', 'Delete attendance records'),

    ('results', 'view', 'View results'),
    ('results', 'create', 'Create results'),
    ('results', 'edit', 'Edit results'),
    ('results', 'delete', 'Delete results'),
    ('results', 'download', 'Download results'),

    ('accountant', 'view', 'View accounting records'),
    ('accountant', 'create', 'Create accounting records'),
    ('accountant', 'edit', 'Edit accounting records'),
    ('accountant', 'delete', 'Delete accounting records'),

    ('settings', 'view', 'View settings');
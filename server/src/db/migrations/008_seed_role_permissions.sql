INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM (
    VALUES
        -- Admin
        ('Admin', 'students', 'view'),
        ('Admin', 'students', 'create'),
        ('Admin', 'students', 'edit'),
        ('Admin', 'students', 'delete'),

        ('Admin', 'teachers', 'view'),
        ('Admin', 'teachers', 'create'),
        ('Admin', 'teachers', 'edit'),
        ('Admin', 'teachers', 'delete'),

        ('Admin', 'classes', 'view'),
        ('Admin', 'classes', 'create'),
        ('Admin', 'classes', 'edit'),
        ('Admin', 'classes', 'delete'),

        ('Admin', 'sections', 'view'),
        ('Admin', 'sections', 'create'),
        ('Admin', 'sections', 'edit'),
        ('Admin', 'sections', 'delete'),

        ('Admin', 'academicSetup', 'view'),
        ('Admin', 'academicSetup', 'create'),
        ('Admin', 'academicSetup', 'edit'),
        ('Admin', 'academicSetup', 'delete'),

        ('Admin', 'attendance', 'view'),
        ('Admin', 'attendance', 'create'),
        ('Admin', 'attendance', 'edit'),
        ('Admin', 'attendance', 'delete'),

        ('Admin', 'results', 'view'),
        ('Admin', 'results', 'create'),
        ('Admin', 'results', 'edit'),
        ('Admin', 'results', 'delete'),
        ('Admin', 'results', 'download'),

        ('Admin', 'accountant', 'view'),
        ('Admin', 'accountant', 'create'),
        ('Admin', 'accountant', 'edit'),
        ('Admin', 'accountant', 'delete'),

        ('Admin', 'settings', 'view'),

        -- Exam Officer
        ('Exam Officer', 'students', 'view'),
        ('Exam Officer', 'teachers', 'view'),
        ('Exam Officer', 'classes', 'view'),
        ('Exam Officer', 'sections', 'view'),
        ('Exam Officer', 'academicSetup', 'view'),
        ('Exam Officer', 'attendance', 'view'),
        ('Exam Officer', 'results', 'view'),
        ('Exam Officer', 'results', 'create'),
        ('Exam Officer', 'results', 'edit'),
        ('Exam Officer', 'results', 'download'),

        -- Teacher
        ('Teacher', 'students', 'view'),
        ('Teacher', 'teachers', 'view'),
        ('Teacher', 'classes', 'view'),
        ('Teacher', 'sections', 'view'),
        ('Teacher', 'academicSetup', 'view'),
        ('Teacher', 'attendance', 'view'),
        ('Teacher', 'attendance', 'create'),
        ('Teacher', 'attendance', 'edit'),

        -- Accountant
        ('Accountant', 'accountant', 'view'),
        ('Accountant', 'accountant', 'create'),
        ('Accountant', 'accountant', 'edit'),
        ('Accountant', 'accountant', 'delete')

) AS mapping(role_name, resource, action)
JOIN roles r
    ON r.name = mapping.role_name
JOIN permissions p
    ON p.resource = mapping.resource
   AND p.action = mapping.action;
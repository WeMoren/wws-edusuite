BEGIN;

-- Create dedicated permissions for Student Promotion Criteria management.
INSERT INTO permissions (resource, action, description)
VALUES
  (
    'studentPromotionCriteria',
    'view',
    'View student promotion criteria configurations and versions'
  ),
  (
    'studentPromotionCriteria',
    'create',
    'Create student promotion criteria configurations and versions'
  ),
  (
    'studentPromotionCriteria',
    'edit',
    'Edit, seal, and activate student promotion criteria versions'
  )
ON CONFLICT (resource, action) DO NOTHING;

-- Principal, Exam Officer, and School Admin can view criteria.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON p.resource = 'studentPromotionCriteria'
 AND p.action = 'view'
WHERE r.name IN ('Principal', 'Exam Officer', 'School Admin')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Only Principal and Exam Officer can create criteria.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON p.resource = 'studentPromotionCriteria'
 AND p.action = 'create'
WHERE r.name IN ('Principal', 'Exam Officer')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Only Principal and Exam Officer can edit, seal, and activate criteria.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON p.resource = 'studentPromotionCriteria'
 AND p.action = 'edit'
WHERE r.name IN ('Principal', 'Exam Officer')
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

BEGIN;

INSERT INTO staff_positions (
    id,
    code,
    name,
    description
)
VALUES (
    '00000000-0000-0000-0000-000000000006',
    'school_admin',
    'School Admin',
    'School-level administrator responsible for academic setup, settings, and subscription management.'
)
ON CONFLICT DO NOTHING;

COMMIT;

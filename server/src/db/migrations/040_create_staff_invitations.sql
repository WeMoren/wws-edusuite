BEGIN;

-- Store each staff member's official contact email.
-- Existing staff records remain valid because this column is nullable.
ALTER TABLE school_staff
ADD COLUMN email VARCHAR(255);

-- Store invitation lifecycle data separately from login accounts.
-- Only the SHA-256 hash of the raw invitation token is stored.
CREATE TABLE staff_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id),

    school_staff_id UUID NOT NULL
        REFERENCES school_staff(id),

    invited_by_user_id UUID NOT NULL
        REFERENCES users(id),

    email VARCHAR(255) NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    accepted_at TIMESTAMPTZ,

    invalidated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT staff_invitations_expiry_check
        CHECK (expires_at > created_at),

    CONSTRAINT staff_invitations_lifecycle_check
        CHECK (
            accepted_at IS NULL
            OR invalidated_at IS NULL
        )
);

-- Staff email addresses must be unique within a school,
-- without treating letter-case differences as different addresses.
CREATE UNIQUE INDEX unique_school_staff_email_per_school
ON school_staff (school_id, LOWER(email))
WHERE email IS NOT NULL;

-- Only one unaccepted, non-invalidated invitation may exist per staff member.
-- Expired invitations are invalidated when a replacement is issued.
CREATE UNIQUE INDEX unique_pending_invitation_per_staff
ON staff_invitations (school_staff_id)
WHERE accepted_at IS NULL
  AND invalidated_at IS NULL;

-- Support school-scoped invitation history and staff invitation lookups.
CREATE INDEX idx_staff_invitations_school_created
ON staff_invitations (school_id, created_at DESC);

CREATE INDEX idx_staff_invitations_staff_created
ON staff_invitations (school_staff_id, created_at DESC);

-- Add the explicit invitation permission without duplicating existing data.
INSERT INTO permissions (
    resource,
    action,
    description
)
SELECT
    'staff',
    'invite',
    'Invite eligible school staff'
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE resource = 'staff'
      AND action = 'invite'
);

-- Grant invitation permission to the Principal role only.
-- Role and permission IDs are resolved from the database, not hardcoded.
INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.resource = 'staff'
   AND p.action = 'invite'
WHERE r.name = 'Principal'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

COMMIT;
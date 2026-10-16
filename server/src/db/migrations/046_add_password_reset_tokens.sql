
BEGIN;

-- Increment this version to invalidate all previously issued JWTs.
ALTER TABLE users
ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0
CHECK (token_version >= 0);

-- Store only hashes of password-reset tokens, never the raw tokens.
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT password_reset_token_expiry_after_creation
        CHECK (expires_at > created_at),

    CONSTRAINT password_reset_token_single_terminal_state
        CHECK (used_at IS NULL OR invalidated_at IS NULL)
);

-- Support account history and token cleanup queries.
CREATE INDEX idx_password_reset_tokens_user_created
    ON password_reset_tokens (user_id, created_at DESC);

-- Only one pending reset token per user.
CREATE UNIQUE INDEX idx_password_reset_tokens_one_pending_per_user
    ON password_reset_tokens (user_id)
    WHERE used_at IS NULL AND invalidated_at IS NULL;

COMMIT;

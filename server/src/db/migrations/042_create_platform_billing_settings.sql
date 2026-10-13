BEGIN;

-- Store platform-wide WWS subscription billing configuration.
CREATE TABLE platform_billing_settings (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE
        CHECK (singleton = TRUE),

    minimum_annual_amount NUMERIC(12, 2) NOT NULL
        CHECK (minimum_annual_amount >= 0),

    trial_duration_days INTEGER NOT NULL
        CHECK (trial_duration_days > 0),

    grace_period_days INTEGER NOT NULL
        CHECK (grace_period_days >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initial platform billing settings.
INSERT INTO platform_billing_settings (
    singleton,
    minimum_annual_amount,
    trial_duration_days,
    grace_period_days
)
VALUES (
    TRUE,
    60000.00,
    30,
    7
);

-- A school may have at most one subscription record.
-- Existing records are preserved.
CREATE UNIQUE INDEX uq_subscriptions_school_id
    ON subscriptions (school_id);

COMMIT;

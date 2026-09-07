CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT,

    price_per_student NUMERIC(12, 2) NOT NULL
        CHECK (price_per_student >= 0),

    billing_period VARCHAR(20) NOT NULL DEFAULT 'annual'
        CHECK (billing_period IN ('annual')),

    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    plan_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (
            status IN (
                'trial',
                'active',
                'expired',
                'suspended',
                'cancelled'
            )
        ),

    billing_period VARCHAR(20) NOT NULL
        CHECK (billing_period IN ('annual')),

    price_per_student NUMERIC(12, 2) NOT NULL
        CHECK (price_per_student >= 0),

    active_student_count INTEGER NOT NULL DEFAULT 0
        CHECK (active_student_count >= 0),

    amount NUMERIC(12, 2) NOT NULL
        CHECK (amount >= 0),

    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',

    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,

    grace_period_end TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_subscriptions_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_subscriptions_plan
        FOREIGN KEY (plan_id)
        REFERENCES subscription_plans(id)
        ON DELETE RESTRICT
);


CREATE TABLE subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    subscription_id UUID NOT NULL,
    school_id UUID NOT NULL,

    amount NUMERIC(12, 2) NOT NULL
        CHECK (amount >= 0),

    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',

    status VARCHAR(20) NOT NULL
        CHECK (
            status IN (
                'pending',
                'success',
                'failed'
            )
        ),

    payment_reference VARCHAR(255) UNIQUE,

    payment_method VARCHAR(50),

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_subscription_payments_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_subscription_payments_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);
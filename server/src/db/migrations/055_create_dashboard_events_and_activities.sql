BEGIN;

-- School-owned events shown in the dashboard and Events page.
CREATE TABLE school_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,

    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_school_events_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_school_events_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_school_events_school_date
    ON school_events (school_id, event_date);

-- Backend-generated activity history; users cannot submit activity records directly.
CREATE TABLE recent_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_recent_activities_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recent_activities_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_recent_activities_school_created
    ON recent_activities (school_id, created_at DESC);

COMMIT;

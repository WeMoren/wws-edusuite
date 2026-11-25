import pool from "../config/db.js";

export const getSubscriptionAccess = async (schoolId) => {
    const result = await pool.query(
        `
        SELECT
            s.id,
            s.status,
            s.trial_end,
            s.end_date,
            s.grace_period_end,
            settings.grace_period_days,

            NOW() AS database_now,

            CASE
                WHEN s.status = 'trial'
                 AND s.trial_end IS NOT NULL
                 AND NOW() < s.trial_end
                THEN 'active'

                WHEN s.status = 'trial'
                 AND s.trial_end IS NOT NULL
                 AND NOW() < (
                     s.trial_end
                     + (settings.grace_period_days * INTERVAL '1 day')
                 )
                THEN 'grace'

                WHEN s.status = 'trial'
                 AND s.trial_end IS NOT NULL
                THEN 'restricted'

                WHEN s.status IN ('active', 'expired')
                 AND s.end_date IS NOT NULL
                 AND NOW() < s.end_date
                THEN 'active'

                WHEN s.status IN ('active', 'expired')
                 AND s.end_date IS NOT NULL
                 AND s.grace_period_end IS NOT NULL
                 AND NOW() < s.grace_period_end
                THEN 'grace'

                WHEN s.status IN ('active', 'expired')
                 AND s.end_date IS NOT NULL
                THEN 'restricted'

                WHEN s.status IN ('suspended', 'cancelled')
                THEN 'unmanaged'

                ELSE NULL
            END AS access_state,

            CASE
                WHEN s.status = 'trial'
                 AND s.trial_end IS NOT NULL
                THEN
                    s.trial_end
                    + (settings.grace_period_days * INTERVAL '1 day')

                WHEN s.status IN ('active', 'expired')
                THEN s.grace_period_end

                ELSE NULL
            END AS effective_grace_period_end,

            CASE
                WHEN s.status = 'trial'
                 AND s.trial_end IS NOT NULL
                 AND NOW() < s.trial_end
                THEN s.trial_end

                WHEN s.status = 'trial'
                 AND s.trial_end IS NOT NULL
                THEN
                    s.trial_end
                    + (settings.grace_period_days * INTERVAL '1 day')

                WHEN s.status IN ('active', 'expired')
                 AND s.end_date IS NOT NULL
                 AND NOW() < s.end_date
                THEN s.end_date

                WHEN s.status IN ('active', 'expired')
                THEN s.grace_period_end

                ELSE NULL
            END AS access_deadline

        FROM subscriptions s

        CROSS JOIN platform_billing_settings settings

        WHERE s.school_id = $1
        LIMIT 1;
        `,
        [schoolId]
    );

    if (result.rows.length !== 1) {
        const error = new Error(
            "Subscription access information is unavailable."
        );

        error.code = "SUBSCRIPTION_ACCESS_UNAVAILABLE";
        error.statusCode = 503;

        throw error;
    }

    const subscription = result.rows[0];

    if (!subscription.access_state) {
        const error = new Error(
            "Subscription dates are incomplete or the subscription status is unsupported."
        );

        error.code = "SUBSCRIPTION_ACCESS_UNAVAILABLE";
        error.statusCode = 503;

        throw error;
    }

    const now = new Date(subscription.database_now);
    const accessDeadline = subscription.access_deadline
        ? new Date(subscription.access_deadline)
        : null;

    const daysRemaining = subscription.access_state === "unmanaged"
        ? null
        : accessDeadline
            ? Math.max(
                0,
                Math.ceil(
                    (accessDeadline.getTime() - now.getTime())
                    / (1000 * 60 * 60 * 24)
                )
            )
            : 0;
    return {
        state: subscription.access_state,
        allowed: subscription.access_state !== "restricted",
        grace_period_end: subscription.effective_grace_period_end,
        days_remaining: daysRemaining,
    };
};

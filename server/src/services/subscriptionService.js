
import pool from "../config/db.js";

const GRACE_PERIOD_DAYS = 7;

const addDays = (date, days) => {
    const result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
};

const addOneYear = (date) => {
    const result = new Date(date);

    result.setFullYear(result.getFullYear() + 1);

    return result;
};

export const activateOrRenewSubscription = async ({
    subscriptionId,
    paymentAmount,
    paymentReference,
    paymentMethod = null,
}) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const subscriptionResult = await client.query(
            `
            SELECT
                s.id,
                s.school_id,
                s.status,
                s.end_date,
                s.grace_period_end,
                s.price_per_student,
                s.currency
            FROM subscriptions s
            WHERE s.id = $1
            FOR UPDATE;
            `,
            [subscriptionId]
        );

        if (subscriptionResult.rows.length === 0) {
            throw new Error("Subscription not found.");
        }

        const subscription = subscriptionResult.rows[0];

        const paymentDate = new Date();

        let startDate;
        let endDate;

        if (
            subscription.status === "trial" ||
            subscription.status === "expired"
        ) {
            startDate = paymentDate;
            endDate = addOneYear(paymentDate);
        } else if (
            subscription.status === "active" &&
            subscription.end_date
        ) {
            startDate = subscription.end_date;
            endDate = addOneYear(subscription.end_date);
        } else {
            throw new Error(
                "Subscription cannot be activated or renewed from its current status."
            );
        }

        const gracePeriodEnd = addDays(
            endDate,
            GRACE_PERIOD_DAYS
        );

        const paymentResult = await client.query(
            `
            INSERT INTO subscription_payments (
                subscription_id,
                school_id,
                amount,
                currency,
                status,
                payment_reference,
                payment_method,
                paid_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                'success',
                $5,
                $6,
                $7
            )
            RETURNING
                id,
                subscription_id,
                school_id,
                amount,
                currency,
                status,
                payment_reference,
                payment_method,
                paid_at,
                created_at;
            `,
            [
                subscription.id,
                subscription.school_id,
                paymentAmount,
                subscription.currency,
                paymentReference,
                paymentMethod,
                paymentDate,
            ]
        );

        const subscriptionUpdate = await client.query(
            `
            UPDATE subscriptions
            SET
                status = 'active',
                start_date = $1,
                end_date = $2,
                grace_period_end = $3,
                amount = $4,
                updated_at = NOW()
            WHERE id = $5
            RETURNING
                id,
                school_id,
                plan_id,
                status,
                billing_period,
                price_per_student,
                active_student_count,
                amount,
                currency,
                trial_start,
                trial_end,
                start_date,
                end_date,
                grace_period_end,
                created_at,
                updated_at;
            `,
            [
                startDate,
                endDate,
                gracePeriodEnd,
                paymentAmount,
                subscription.id,
            ]
        );

        await client.query("COMMIT");

        return {
            subscription: subscriptionUpdate.rows[0],
            payment: paymentResult.rows[0],
        };
    } catch (error) {
        await client.query("ROLLBACK");

        throw error;
    } finally {
        client.release();
    }
};


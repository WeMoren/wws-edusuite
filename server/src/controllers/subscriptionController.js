import pool from "../config/db.js";
import { activateOrRenewSubscription } from "../services/subscriptionService.js";

export const getSchoolSubscription = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                s.id,
                s.school_id,
                s.status,

                s.billing_period,
                s.price_per_student,
                s.active_student_count,
                s.amount,
                s.currency,

                s.trial_start,
                s.trial_end,

                s.start_date,
                s.end_date,
                s.grace_period_end,

                s.created_at,
                s.updated_at,

                p.id AS plan_id,
                p.name AS plan_name,
                p.description AS plan_description

            FROM subscriptions s

            JOIN subscription_plans p
                ON p.id = s.plan_id

            WHERE s.school_id = $1
            ORDER BY s.created_at DESC
            LIMIT 1;
            `,
            [schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No subscription found for this school.",
            });
        }

        const subscription = result.rows[0];

        let remainingTrialDays = 0;

        if (
            subscription.status === "trial" &&
            subscription.trial_end
        ) {
            const now = new Date();
            const trialEnd = new Date(subscription.trial_end);

            const difference =
                trialEnd.getTime() - now.getTime();

            remainingTrialDays = Math.max(
                0,
                Math.ceil(
                    difference / (1000 * 60 * 60 * 24)
                )
            );
        }

        return res.status(200).json({
            subscription: {
                ...subscription,
                remaining_trial_days: remainingTrialDays,
            },
        });
    } catch (error) {
        console.error(
            "Failed to fetch school subscription:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch school subscription.",
        });
    }
};

export const createSchoolSubscription = async (req, res) => {
    try {
        const { schoolId } = req;
        const { planId, trialDays = 30 } = req.body;

        if (!planId) {
            return res.status(400).json({
                message: "Plan ID is required.",
            });
        }

        if (
            !Number.isInteger(Number(trialDays)) ||
            Number(trialDays) < 0
        ) {
            return res.status(400).json({
                message: "Trial days must be a non-negative integer.",
            });
        }

        const planResult = await pool.query(
            `
            SELECT
                id,
                price_per_student,
                billing_period,
                currency,
                is_active
            FROM subscription_plans
            WHERE id = $1
              AND is_active = TRUE;
            `,
            [planId]
        );

        if (planResult.rows.length === 0) {
            return res.status(404).json({
                message: "Subscription plan not found or inactive.",
            });
        }

        const plan = planResult.rows[0];

        const existingSubscription = await pool.query(
            `
            SELECT id
            FROM subscriptions
            WHERE school_id = $1
            LIMIT 1;
            `,
            [schoolId]
        );

        if (existingSubscription.rows.length > 0) {
            return res.status(409).json({
                message: "This school already has a subscription.",
            });
        }

        const trialStart = new Date();
        const trialEnd = new Date(trialStart);

        trialEnd.setDate(
            trialEnd.getDate() + Number(trialDays)
        );

        const result = await pool.query(
            `
            INSERT INTO subscriptions (
                school_id,
                plan_id,
                status,
                billing_period,
                price_per_student,
                active_student_count,
                amount,
                currency,
                trial_start,
                trial_end
            )
            VALUES (
                $1,
                $2,
                'trial',
                $3,
                $4,
                0,
                0,
                $5,
                $6,
                $7
            )
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
                schoolId,
                plan.id,
                plan.billing_period,
                plan.price_per_student,
                plan.currency,
                trialStart,
                trialEnd,
            ]
        );

        return res.status(201).json({
            message: "School subscription created successfully.",
            subscription: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to create school subscription:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create school subscription.",
        });
    }
};

export const getSubscriptionPayments = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                sp.id,
                sp.subscription_id,
                sp.school_id,

                sp.amount,
                sp.currency,

                sp.status,
                sp.payment_reference,
                sp.payment_method,

                sp.paid_at,
                sp.created_at

            FROM subscription_payments sp

            WHERE sp.school_id = $1

            ORDER BY sp.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            payments: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch subscription payments:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch subscription payments.",
        });
    }
};

export const activateOrRenewSchoolSubscription = async (req, res) => {
    try {
        const { schoolId } = req;
        const {
            subscriptionId,
            paymentAmount,
            paymentReference,
            paymentMethod = null,
        } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({
                message: "Subscription ID is required.",
            });
        }

        if (
            paymentAmount === undefined ||
            paymentAmount === null ||
            Number.isNaN(Number(paymentAmount)) ||
            Number(paymentAmount) < 0
        ) {
            return res.status(400).json({
                message: "Payment amount must be a non-negative number.",
            });
        }

        if (!paymentReference) {
            return res.status(400).json({
                message: "Payment reference is required.",
            });
        }

        const subscriptionResult = await pool.query(
            `
            SELECT id
            FROM subscriptions
            WHERE id = $1
              AND school_id = $2;
            `,
            [subscriptionId, schoolId]
        );

        if (subscriptionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Subscription not found for this school.",
            });
        }

        const result = await activateOrRenewSubscription({
            subscriptionId,
            paymentAmount: Number(paymentAmount),
            paymentReference,
            paymentMethod,
        });

        return res.status(200).json({
            message: "Subscription activated or renewed successfully.",
            ...result,
        });
    } catch (error) {
        console.error(
            "Failed to activate or renew subscription:",
            error.message
        );

        return res.status(400).json({
            message: error.message,
        });
    }
};
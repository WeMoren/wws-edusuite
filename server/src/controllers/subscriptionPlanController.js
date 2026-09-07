import pool from "../config/db.js";

export const getSubscriptionPlans = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                description,
                price_per_student,
                billing_period,
                currency,
                is_active,
                created_at,
                updated_at
            FROM subscription_plans
            WHERE is_active = TRUE
            ORDER BY price_per_student ASC;
            `
        );

        return res.status(200).json({
            plans: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch subscription plans:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch subscription plans.",
        });
    }
};



export const createSubscriptionPlan = async (req, res) => {
    try {
        const {
            name,
            description,
            pricePerStudent,
            currency,
        } = req.body;

        if (!name || pricePerStudent === undefined) {
            return res.status(400).json({
                message: "Name and price per student are required.",
            });
        }

        if (Number(pricePerStudent) < 0) {
            return res.status(400).json({
                message: "Price per student cannot be negative.",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO subscription_plans (
                name,
                description,
                price_per_student,
                billing_period,
                currency
            )
            VALUES ($1, $2, $3, 'annual', $4)
            RETURNING
                id,
                name,
                description,
                price_per_student,
                billing_period,
                currency,
                is_active,
                created_at,
                updated_at;
            `,
            [
                name,
                description || null,
                pricePerStudent,
                currency || "NGN",
            ]
        );

        return res.status(201).json({
            message: "Subscription plan created successfully.",
            plan: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to create subscription plan:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create subscription plan.",
        });
    }
};



export const updateSubscriptionPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            pricePerStudent,
            currency,
            isActive,
        } = req.body;

        if (
            name === undefined &&
            description === undefined &&
            pricePerStudent === undefined &&
            currency === undefined &&
            isActive === undefined
        ) {
            return res.status(400).json({
                message: "At least one field is required.",
            });
        }

        if (
            pricePerStudent !== undefined &&
            Number(pricePerStudent) < 0
        ) {
            return res.status(400).json({
                message: "Price per student cannot be negative.",
            });
        }

        const result = await pool.query(
            `
            UPDATE subscription_plans
            SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                price_per_student = COALESCE($3, price_per_student),
                currency = COALESCE($4, currency),
                is_active = COALESCE($5, is_active),
                updated_at = NOW()
            WHERE id = $6
            RETURNING
                id,
                name,
                description,
                price_per_student,
                billing_period,
                currency,
                is_active,
                created_at,
                updated_at;
            `,
            [
                name ?? null,
                description ?? null,
                pricePerStudent ?? null,
                currency ?? null,
                isActive ?? null,
                id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Subscription plan not found.",
            });
        }

        return res.status(200).json({
            message: "Subscription plan updated successfully.",
            plan: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to update subscription plan:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update subscription plan.",
        });
    }
};
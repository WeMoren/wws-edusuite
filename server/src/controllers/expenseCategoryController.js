import pool from "../config/db.js";

// GET all expense categories
export const getExpenseCategories = async (req, res) => {
    const schoolId = req.schoolId;

    try {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                description,
                is_active,
                created_at,
                updated_at
            FROM expense_categories
            WHERE school_id = $1
            ORDER BY name ASC;
            `,
            [schoolId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get expense categories error:", error);

        return res.status(500).json({
            message: "Failed to fetch expense categories.",
        });
    }
};

// GET one expense category
export const getExpenseCategoryById = async (req, res) => {
    const schoolId = req.schoolId;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                description,
                is_active,
                created_at,
                updated_at
            FROM expense_categories
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense category not found.",
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Get expense category error:", error);

        return res.status(500).json({
            message: "Failed to fetch expense category.",
        });
    }
};

// CREATE expense category
export const createExpenseCategory = async (req, res) => {
    const schoolId = req.schoolId;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            message: "Expense category name is required.",
        });
    }

    const trimmedName = name.trim();

    try {
        const result = await pool.query(
            `
            INSERT INTO expense_categories (
                school_id,
                name,
                description
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                name,
                description,
                is_active,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                trimmedName,
                description?.trim() || null,
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Create expense category error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "An expense category with this name already exists.",
            });
        }

        return res.status(500).json({
            message: "Failed to create expense category.",
        });
    }
};

// UPDATE expense category
export const updateExpenseCategory = async (req, res) => {
    const schoolId = req.schoolId;
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (
        name !== undefined &&
        (!name || !name.trim())
    ) {
        return res.status(400).json({
            message: "Expense category name cannot be empty.",
        });
    }

    try {
        const existingResult = await pool.query(
            `
            SELECT
                id,
                name,
                description,
                is_active
            FROM expense_categories
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Expense category not found.",
            });
        }

        const existingCategory = existingResult.rows[0];

        const updatedName =
            name !== undefined
                ? name.trim()
                : existingCategory.name;

        const updatedDescription =
            description !== undefined
                ? description?.trim() || null
                : existingCategory.description;

        const updatedIsActive =
            isActive !== undefined
                ? isActive
                : existingCategory.is_active;

        if (typeof updatedIsActive !== "boolean") {
            return res.status(400).json({
                message: "isActive must be a boolean.",
            });
        }

        const result = await pool.query(
            `
            UPDATE expense_categories
            SET
                name = $1,
                description = $2,
                is_active = $3,
                updated_at = NOW()
            WHERE id = $4
              AND school_id = $5
            RETURNING
                id,
                name,
                description,
                is_active,
                created_at,
                updated_at;
            `,
            [
                updatedName,
                updatedDescription,
                updatedIsActive,
                id,
                schoolId,
            ]
        );

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Update expense category error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "An expense category with this name already exists.",
            });
        }

        return res.status(500).json({
            message: "Failed to update expense category.",
        });
    }
};
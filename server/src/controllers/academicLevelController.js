import pool from "../config/db.js";

export const getAcademicLevels = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                id,
                school_id,
                name,
                category,
                display_order,
                created_at,
                updated_at
            FROM academic_levels
            WHERE school_id = $1
            ORDER BY display_order ASC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            levels: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch academic levels:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch academic levels.",
        });
    }
};

export const getAcademicLevelById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                id,
                school_id,
                name,
                category,
                display_order,
                created_at,
                updated_at
            FROM academic_levels
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Academic level not found.",
            });
        }

        return res.status(200).json({
            level: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch academic level:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch academic level.",
        });
    }
};

export const createAcademicLevel = async (req, res) => {
    try {
        const { schoolId } = req;

        const {
            name,
            category,
            displayOrder,
        } = req.body;

        if (!name || !category || displayOrder === undefined) {
            return res.status(400).json({
                message:
                    "Level name, category, and display order are required.",
            });
        }

        if (!Number.isInteger(displayOrder) || displayOrder <= 0) {
            return res.status(400).json({
                message:
                    "Display order must be a positive integer.",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO academic_levels (
                school_id,
                name,
                category,
                display_order
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                school_id,
                name,
                category,
                display_order,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                name,
                category,
                displayOrder,
            ]
        );

        return res.status(201).json({
            message: "Academic level created successfully.",
            level: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "An academic level with this name already exists in this school.",
            });
        }

        console.error(
            "Failed to create academic level:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create academic level.",
        });
    }
};

export const updateAcademicLevel = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            name,
            category,
            displayOrder,
        } = req.body;

        const existingResult = await pool.query(
            `
            SELECT
                name,
                category,
                display_order
            FROM academic_levels
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic level not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextName = name ?? existing.name;
        const nextCategory =
            category ?? existing.category;
        const nextDisplayOrder =
            displayOrder ?? existing.display_order;

        if (
            !Number.isInteger(nextDisplayOrder) ||
            nextDisplayOrder <= 0
        ) {
            return res.status(400).json({
                message:
                    "Display order must be a positive integer.",
            });
        }

        const result = await pool.query(
            `
            UPDATE academic_levels
            SET
                name = $1,
                category = $2,
                display_order = $3,
                updated_at = NOW()
            WHERE id = $4
              AND school_id = $5
            RETURNING
                id,
                school_id,
                name,
                category,
                display_order,
                created_at,
                updated_at;
            `,
            [
                nextName,
                nextCategory,
                nextDisplayOrder,
                id,
                schoolId,
            ]
        );

        return res.status(200).json({
            message: "Academic level updated successfully.",
            level: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "An academic level with this name already exists in this school.",
            });
        }

        console.error(
            "Failed to update academic level:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update academic level.",
        });
    }
};

export const deleteAcademicLevel = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM academic_levels
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Academic level not found.",
            });
        }

        return res.status(200).json({
            message: "Academic level deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Academic level cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete academic level:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete academic level.",
        });
    }
};
import pool from "../config/db.js";

export const getClasses = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                c.id,
                c.school_id,
                c.academic_session_id,
                c.academic_level_id,
                c.name,
                c.created_at,
                c.updated_at,

                a.name AS academic_session_name,

                al.name AS academic_level_name,
                al.category AS academic_level_category

            FROM classes c

            JOIN academic_sessions a
                ON a.id = c.academic_session_id

            JOIN academic_levels al
                ON al.id = c.academic_level_id

            WHERE c.school_id = $1

            ORDER BY
                a.start_date DESC,
                al.display_order ASC,
                c.name ASC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            classes: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch classes:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch classes.",
        });
    }
};

export const getClassById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                c.id,
                c.school_id,
                c.academic_session_id,
                c.academic_level_id,
                c.name,
                c.created_at,
                c.updated_at,

                a.name AS academic_session_name,

                al.name AS academic_level_name,
                al.category AS academic_level_category

            FROM classes c

            JOIN academic_sessions a
                ON a.id = c.academic_session_id

            JOIN academic_levels al
                ON al.id = c.academic_level_id

            WHERE c.id = $1
              AND c.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Class not found.",
            });
        }

        return res.status(200).json({
            class: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch class:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch class.",
        });
    }
};

export const createClass = async (req, res) => {
    try {
        const { schoolId } = req;

        const {
            academicSessionId,
            academicLevelId,
            name,
        } = req.body;

        if (
            !academicSessionId ||
            !academicLevelId ||
            !name
        ) {
            return res.status(400).json({
                message:
                    "Academic session, academic level, and class name are required.",
            });
        }

        const sessionResult = await pool.query(
            `
            SELECT id
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2;
            `,
            [academicSessionId, schoolId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic session not found.",
            });
        }

        const levelResult = await pool.query(
            `
            SELECT id
            FROM academic_levels
            WHERE id = $1
              AND school_id = $2;
            `,
            [academicLevelId, schoolId]
        );

        if (levelResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic level not found.",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO classes (
                school_id,
                academic_session_id,
                academic_level_id,
                name
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                school_id,
                academic_session_id,
                academic_level_id,
                name,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                academicSessionId,
                academicLevelId,
                name,
            ]
        );

        return res.status(201).json({
            message: "Class created successfully.",
            class: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A class with this name already exists for this academic session and level.",
            });
        }

        console.error(
            "Failed to create class:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create class.",
        });
    }
};

export const updateClass = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            academicSessionId,
            academicLevelId,
            name,
        } = req.body;

        const existingResult = await pool.query(
            `
            SELECT
                academic_session_id,
                academic_level_id,
                name
            FROM classes
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Class not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextSessionId =
            academicSessionId ??
            existing.academic_session_id;

        const nextLevelId =
            academicLevelId ??
            existing.academic_level_id;

        const nextName =
            name ??
            existing.name;

        const sessionResult = await pool.query(
            `
            SELECT id
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2;
            `,
            [nextSessionId, schoolId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic session not found.",
            });
        }

        const levelResult = await pool.query(
            `
            SELECT id
            FROM academic_levels
            WHERE id = $1
              AND school_id = $2;
            `,
            [nextLevelId, schoolId]
        );

        if (levelResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic level not found.",
            });
        }

        const result = await pool.query(
            `
            UPDATE classes
            SET
                academic_session_id = $1,
                academic_level_id = $2,
                name = $3,
                updated_at = NOW()
            WHERE id = $4
              AND school_id = $5
            RETURNING
                id,
                school_id,
                academic_session_id,
                academic_level_id,
                name,
                created_at,
                updated_at;
            `,
            [
                nextSessionId,
                nextLevelId,
                nextName,
                id,
                schoolId,
            ]
        );

        return res.status(200).json({
            message: "Class updated successfully.",
            class: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A class with this name already exists for this academic session and level.",
            });
        }

        console.error(
            "Failed to update class:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update class.",
        });
    }
};

export const deleteClass = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM classes
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Class not found.",
            });
        }

        return res.status(200).json({
            message: "Class deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Class cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete class:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete class.",
        });
    }
};
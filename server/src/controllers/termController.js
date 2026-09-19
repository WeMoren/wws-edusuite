import pool from "../config/db.js";

export const getTerms = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                t.id,
                t.school_id,
                t.academic_session_id,
                t.name,
                t.display_order,
                t.start_date,
                t.end_date,
                t.is_current,
                t.created_at,
                t.updated_at,

                a.name AS academic_session_name

            FROM terms t

            JOIN academic_sessions a
                ON a.id = t.academic_session_id

            WHERE t.school_id = $1

            ORDER BY
                a.start_date DESC,
                t.display_order ASC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            terms: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch terms:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch terms.",
        });
    }
};

export const getTermById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                t.id,
                t.school_id,
                t.academic_session_id,
                t.name,
                t.display_order,
                t.start_date,
                t.end_date,
                t.is_current,
                t.created_at,
                t.updated_at,

                a.name AS academic_session_name

            FROM terms t

            JOIN academic_sessions a
                ON a.id = t.academic_session_id

            WHERE t.id = $1
              AND t.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Term not found.",
            });
        }

        return res.status(200).json({
            term: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch term:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch term.",
        });
    }
};

export const createTerm = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            academicSessionId,
            name,
            displayOrder,
            startDate,
            endDate,
            isCurrent = false,
        } = req.body;

        if (
            !academicSessionId ||
            !name ||
            displayOrder === undefined ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                message:
                    "Academic session, name, display order, start date, and end date are required.",
            });
        }

        if (
            !Number.isInteger(displayOrder) ||
            displayOrder <= 0
        ) {
            return res.status(400).json({
                message:
                    "Display order must be a positive integer.",
            });
        }

        if (typeof isCurrent !== "boolean") {
            return res.status(400).json({
                message:
                    "isCurrent must be a boolean.",
            });
        }

        if (endDate < startDate) {
            return res.status(400).json({
                message:
                    "End date cannot be earlier than start date.",
            });
        }

        /*
         * Validate that the academic session belongs
         * to this school.
         */
        const sessionResult = await client.query(
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
                message:
                    "Academic session not found.",
            });
        }

        await client.query("BEGIN");

        const result = await client.query(
            `
            INSERT INTO terms (
                school_id,
                academic_session_id,
                name,
                display_order,
                start_date,
                end_date,
                is_current
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                school_id,
                academic_session_id,
                name,
                display_order,
                start_date,
                end_date,
                is_current,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                academicSessionId,
                name,
                displayOrder,
                startDate,
                endDate,
                isCurrent,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Term created successfully.",
            term: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A term with this name already exists for this academic session, or another current term already exists.",
            });
        }

        console.error(
            "Failed to create term:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create term.",
        });
    } finally {
        client.release();
    }
};

export const updateTerm = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            name,
            displayOrder,
            startDate,
            endDate,
            isCurrent,
        } = req.body;

        const existingResult = await pool.query(
            `
            SELECT
                id,
                name,
                display_order,
                start_date,
                end_date,
                is_current
            FROM terms
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Term not found.",
            });
        }

        const existing =
            existingResult.rows[0];

        const nextName =
            name ?? existing.name;

        const nextDisplayOrder =
            displayOrder ?? existing.display_order;

        const nextStartDate =
            startDate ?? existing.start_date;

        const nextEndDate =
            endDate ?? existing.end_date;

        const nextIsCurrent =
            isCurrent ?? existing.is_current;

        if (
            !Number.isInteger(nextDisplayOrder) ||
            nextDisplayOrder <= 0
        ) {
            return res.status(400).json({
                message:
                    "Display order must be a positive integer.",
            });
        }

        if (typeof nextIsCurrent !== "boolean") {
            return res.status(400).json({
                message:
                    "isCurrent must be a boolean.",
            });
        }

        if (nextEndDate < nextStartDate) {
            return res.status(400).json({
                message:
                    "End date cannot be earlier than start date.",
            });
        }

        const result = await pool.query(
            `
            UPDATE terms
            SET
                name = $1,
                display_order = $2,
                start_date = $3,
                end_date = $4,
                is_current = $5,
                updated_at = NOW()
            WHERE id = $6
              AND school_id = $7
            RETURNING
                id,
                school_id,
                academic_session_id,
                name,
                display_order,
                start_date,
                end_date,
                is_current,
                created_at,
                updated_at;
            `,
            [
                nextName,
                nextDisplayOrder,
                nextStartDate,
                nextEndDate,
                nextIsCurrent,
                id,
                schoolId,
            ]
        );

        return res.status(200).json({
            message: "Term updated successfully.",
            term: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A term with this name already exists for this academic session, or another current term already exists.",
            });
        }

        console.error(
            "Failed to update term:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update term.",
        });
    }
};

export const deleteTerm = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM terms
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Term not found.",
            });
        }

        return res.status(200).json({
            message: "Term deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Term cannot be deleted because other records reference it.",
            });
        }

        console.error(
            "Failed to delete term:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete term.",
        });
    }
};
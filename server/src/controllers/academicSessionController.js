import pool from "../config/db.js";

export const getAcademicSessions = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                id,
                school_id,
                name,
                start_date,
                end_date,
                is_current,
                created_at,
                updated_at
            FROM academic_sessions
            WHERE school_id = $1
            ORDER BY start_date DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            sessions: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch academic sessions:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch academic sessions.",
        });
    }
};

export const getAcademicSessionById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                id,
                school_id,
                name,
                start_date,
                end_date,
                is_current,
                created_at,
                updated_at
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Academic session not found.",
            });
        }

        return res.status(200).json({
            session: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch academic session:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch academic session.",
        });
    }
};

export const createAcademicSession = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            name,
            startDate,
            endDate,
            isCurrent = false,
        } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                message:
                    "Session name, start date, and end date are required.",
            });
        }

        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({
                message:
                    "End date cannot be earlier than start date.",
            });
        }

        await client.query("BEGIN");

        /*
         * If this session is being made current,
         * remove current status from the school's
         * existing current session first.
         */
        if (isCurrent === true) {
            await client.query(
                `
                UPDATE academic_sessions
                SET
                    is_current = FALSE,
                    updated_at = NOW()
                WHERE school_id = $1
                  AND is_current = TRUE;
                `,
                [schoolId]
            );
        }

        const result = await client.query(
            `
            INSERT INTO academic_sessions (
                school_id,
                name,
                start_date,
                end_date,
                is_current
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                school_id,
                name,
                start_date,
                end_date,
                is_current,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                name,
                startDate,
                endDate,
                isCurrent,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Academic session created successfully.",
            session: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "An academic session with this name already exists in this school.",
            });
        }

        console.error(
            "Failed to create academic session:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create academic session.",
        });
    } finally {
        client.release();
    }
};

export const updateAcademicSession = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            name,
            startDate,
            endDate,
            isCurrent,
        } = req.body;

        const existingResult = await client.query(
            `
            SELECT
                name,
                start_date,
                end_date,
                is_current
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic session not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextName = name ?? existing.name;
        const nextStartDate =
            startDate ?? existing.start_date;
        const nextEndDate =
            endDate ?? existing.end_date;
        const nextIsCurrent =
            isCurrent ?? existing.is_current;

        if (
            new Date(nextEndDate) <
            new Date(nextStartDate)
        ) {
            return res.status(400).json({
                message:
                    "End date cannot be earlier than start date.",
            });
        }

        await client.query("BEGIN");

        if (nextIsCurrent === true) {
            await client.query(
                `
                UPDATE academic_sessions
                SET
                    is_current = FALSE,
                    updated_at = NOW()
                WHERE school_id = $1
                  AND id <> $2
                  AND is_current = TRUE;
                `,
                [schoolId, id]
            );
        }

        const result = await client.query(
            `
            UPDATE academic_sessions
            SET
                name = $1,
                start_date = $2,
                end_date = $3,
                is_current = $4,
                updated_at = NOW()
            WHERE id = $5
              AND school_id = $6
            RETURNING
                id,
                school_id,
                name,
                start_date,
                end_date,
                is_current,
                created_at,
                updated_at;
            `,
            [
                nextName,
                nextStartDate,
                nextEndDate,
                nextIsCurrent,
                id,
                schoolId,
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Academic session updated successfully.",
            session: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "An academic session with this name already exists in this school.",
            });
        }

        console.error(
            "Failed to update academic session:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update academic session.",
        });
    } finally {
        client.release();
    }
};

export const deleteAcademicSession = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM academic_sessions
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Academic session not found.",
            });
        }

        return res.status(200).json({
            message: "Academic session deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Academic session cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete academic session:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete academic session.",
        });
    }
};
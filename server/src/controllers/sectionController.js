import pool from "../config/db.js";

export const getSections = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                sec.id,
                sec.school_id,
                sec.class_id,
                sec.name,
                sec.class_teacher_id,
                sec.room,
                sec.capacity,
                sec.created_at,
                sec.updated_at,

                c.name AS class_name,

                a.name AS academic_session_name,

                al.name AS academic_level_name,

                u.email AS class_teacher_email

            FROM sections sec

            JOIN classes c
                ON c.id = sec.class_id

            JOIN academic_sessions a
                ON a.id = c.academic_session_id

            JOIN academic_levels al
                ON al.id = c.academic_level_id

            LEFT JOIN users u
                ON u.id = sec.class_teacher_id

            WHERE sec.school_id = $1

            ORDER BY
                a.start_date DESC,
                al.display_order ASC,
                c.name ASC,
                sec.name ASC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            sections: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch sections:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch sections.",
        });
    }
};

export const getSectionById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                sec.id,
                sec.school_id,
                sec.class_id,
                sec.name,
                sec.class_teacher_id,
                sec.room,
                sec.capacity,
                sec.created_at,
                sec.updated_at,

                c.name AS class_name,

                a.name AS academic_session_name,

                al.name AS academic_level_name,

                u.email AS class_teacher_email

            FROM sections sec

            JOIN classes c
                ON c.id = sec.class_id

            JOIN academic_sessions a
                ON a.id = c.academic_session_id

            JOIN academic_levels al
                ON al.id = c.academic_level_id

            LEFT JOIN users u
                ON u.id = sec.class_teacher_id

            WHERE sec.id = $1
              AND sec.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Section not found.",
            });
        }

        return res.status(200).json({
            section: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch section:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch section.",
        });
    }
};

export const createSection = async (req, res) => {
    try {
        const { schoolId } = req;

        const {
            classId,
            name,
            classTeacherId = null,
            room = null,
            capacity = null,
        } = req.body;

        if (!classId || !name) {
            return res.status(400).json({
                message:
                    "Class and section name are required.",
            });
        }

        if (
            capacity !== null &&
            (!Number.isInteger(capacity) || capacity <= 0)
        ) {
            return res.status(400).json({
                message:
                    "Capacity must be a positive integer.",
            });
        }

        const classResult = await pool.query(
            `
            SELECT id
            FROM classes
            WHERE id = $1
              AND school_id = $2;
            `,
            [classId, schoolId]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({
                message: "Class not found.",
            });
        }

        if (classTeacherId) {
            const teacherResult = await pool.query(
                `
                SELECT u.id
                FROM users u
                JOIN user_roles ur
                    ON ur.user_id = u.id
                JOIN roles r
                    ON r.id = ur.role_id
                WHERE u.id = $1
                  AND u.school_id = $2
                  AND r.name = 'Teacher';
                `,
                [classTeacherId, schoolId]
            );

            if (teacherResult.rows.length === 0) {
                return res.status(404).json({
                    message:
                        "Class teacher not found.",
                });
            }
        }

        const result = await pool.query(
            `
            INSERT INTO sections (
                school_id,
                class_id,
                name,
                class_teacher_id,
                room,
                capacity
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                school_id,
                class_id,
                name,
                class_teacher_id,
                room,
                capacity,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                classId,
                name,
                classTeacherId,
                room,
                capacity,
            ]
        );

        return res.status(201).json({
            message: "Section created successfully.",
            section: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A section with this name already exists for this class.",
            });
        }

        console.error(
            "Failed to create section:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create section.",
        });
    }
};

export const updateSection = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            classId,
            name,
            classTeacherId,
            room,
            capacity,
        } = req.body;

        const existingResult = await pool.query(
            `
            SELECT
                class_id,
                name,
                class_teacher_id,
                room,
                capacity
            FROM sections
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Section not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextClassId =
            classId ?? existing.class_id;

        const nextName =
            name ?? existing.name;

        const nextClassTeacherId =
            classTeacherId === undefined
                ? existing.class_teacher_id
                : classTeacherId;

        const nextRoom =
            room === undefined
                ? existing.room
                : room;

        const nextCapacity =
            capacity === undefined
                ? existing.capacity
                : capacity;

        if (
            nextCapacity !== null &&
            (!Number.isInteger(nextCapacity) ||
                nextCapacity <= 0)
        ) {
            return res.status(400).json({
                message:
                    "Capacity must be a positive integer.",
            });
        }

        const classResult = await pool.query(
            `
            SELECT id
            FROM classes
            WHERE id = $1
              AND school_id = $2;
            `,
            [nextClassId, schoolId]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({
                message: "Class not found.",
            });
        }

        if (nextClassTeacherId) {
            const teacherResult = await pool.query(
                `
                SELECT u.id
                FROM users u
                JOIN user_roles ur
                    ON ur.user_id = u.id
                JOIN roles r
                    ON r.id = ur.role_id
                WHERE u.id = $1
                  AND u.school_id = $2
                  AND r.name = 'Teacher';
                `,
                [nextClassTeacherId, schoolId]
            );

            if (teacherResult.rows.length === 0) {
                return res.status(404).json({
                    message:
                        "Class teacher not found.",
                });
            }
        }

        const result = await pool.query(
            `
            UPDATE sections
            SET
                class_id = $1,
                name = $2,
                class_teacher_id = $3,
                room = $4,
                capacity = $5,
                updated_at = NOW()
            WHERE id = $6
              AND school_id = $7
            RETURNING
                id,
                school_id,
                class_id,
                name,
                class_teacher_id,
                room,
                capacity,
                created_at,
                updated_at;
            `,
            [
                nextClassId,
                nextName,
                nextClassTeacherId,
                nextRoom,
                nextCapacity,
                id,
                schoolId,
            ]
        );

        return res.status(200).json({
            message: "Section updated successfully.",
            section: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A section with this name already exists for this class.",
            });
        }

        console.error(
            "Failed to update section:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update section.",
        });
    }
};

export const deleteSection = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM sections
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Section not found.",
            });
        }

        return res.status(200).json({
            message: "Section deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Section cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete section:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete section.",
        });
    }
};
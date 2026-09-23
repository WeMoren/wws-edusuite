import pool from "../config/db.js";

export const getSubjects = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                s.id,
                s.school_id,
                s.name,
                s.code,
                s.category,
                s.is_core,
                s.created_at,
                s.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', al.id,
                            'name', al.name,
                            'category', al.category,
                            'displayOrder', al.display_order
                        )
                        ORDER BY al.display_order ASC
                    ) FILTER (WHERE al.id IS NOT NULL),
                    '[]'
                ) AS academic_levels
            FROM subjects s
            LEFT JOIN subject_academic_levels sal
                ON sal.subject_id = s.id
            LEFT JOIN academic_levels al
                ON al.id = sal.academic_level_id
                AND al.school_id = s.school_id
            WHERE s.school_id = $1
            GROUP BY s.id
            ORDER BY s.name ASC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            subjects: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch subjects:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch subjects.",
        });
    }
};

export const getSubjectById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                s.id,
                s.school_id,
                s.name,
                s.code,
                s.category,
                s.is_core,
                s.created_at,
                s.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', al.id,
                            'name', al.name,
                            'category', al.category,
                            'displayOrder', al.display_order
                        )
                        ORDER BY al.display_order ASC
                    ) FILTER (WHERE al.id IS NOT NULL),
                    '[]'
                ) AS academic_levels
            FROM subjects s
            LEFT JOIN subject_academic_levels sal
                ON sal.subject_id = s.id
            LEFT JOIN academic_levels al
                ON al.id = sal.academic_level_id
                AND al.school_id = s.school_id
            WHERE s.id = $1
              AND s.school_id = $2
            GROUP BY s.id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Subject not found.",
            });
        }

        return res.status(200).json({
            subject: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch subject:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch subject.",
        });
    }
};


export const createSubject = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            name,
            code,
            category,
            isCore,
            academicLevelIds,
        } = req.body;

        if (
            !name ||
            !code ||
            !category ||
            isCore === undefined ||
            !Array.isArray(academicLevelIds)
        ) {
            return res.status(400).json({
                message:
                    "Subject name, code, category, isCore, and academic level assignments are required.",
            });
        }

        if (academicLevelIds.length === 0) {
            return res.status(400).json({
                message:
                    "A subject must be assigned to at least one academic level.",
            });
        }

        const validCategories = [
            "Core",
            "Science",
            "Art",
            "Commercial",
            "Humanities",
            "Language",
            "Vocational",
            "Other",
        ];

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                message: "Invalid subject category.",
            });
        }

        if (typeof isCore !== "boolean") {
            return res.status(400).json({
                message: "isCore must be a boolean.",
            });
        }

        const uniqueAcademicLevelIds = [
            ...new Set(academicLevelIds),
        ];

        if (
            uniqueAcademicLevelIds.length !==
            academicLevelIds.length
        ) {
            return res.status(400).json({
                message:
                    "Duplicate academic level assignments are not allowed.",
            });
        }

        await client.query("BEGIN");

        const academicLevelsResult = await client.query(
            `
            SELECT id
            FROM academic_levels
            WHERE school_id = $1
              AND id = ANY($2::uuid[]);
            `,
            [schoolId, uniqueAcademicLevelIds]
        );

        if (
            academicLevelsResult.rows.length !==
            uniqueAcademicLevelIds.length
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "One or more academic levels are invalid or do not belong to this school.",
            });
        }

        const subjectResult = await client.query(
            `
            INSERT INTO subjects (
                school_id,
                name,
                code,
                category,
                is_core
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                school_id,
                name,
                code,
                category,
                is_core,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                name,
                code,
                category,
                isCore,
            ]
        );

        const subject = subjectResult.rows[0];

        for (const academicLevelId of uniqueAcademicLevelIds) {
            await client.query(
                `
                INSERT INTO subject_academic_levels (
                    school_id,
                    subject_id,
                    academic_level_id
                )
                VALUES ($1, $2, $3);
                `,
                [
                    schoolId,
                    subject.id,
                    academicLevelId,
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Subject created successfully.",
            subject,
            academicLevelIds: uniqueAcademicLevelIds,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A subject with this name or code already exists in this school.",
            });
        }

        console.error(
            "Failed to create subject:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create subject.",
        });
    } finally {
        client.release();
    }
};



export const updateSubject = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            name,
            code,
            category,
            isCore,
            academicLevelIds,
        } = req.body;

        await client.query("BEGIN");

        const existingResult = await client.query(
            `
            SELECT
                id,
                name,
                code,
                category,
                is_core
            FROM subjects
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Subject not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextName = name ?? existing.name;
        const nextCode = code ?? existing.code;
        const nextCategory =
            category ?? existing.category;
        const nextIsCore =
            isCore ?? existing.is_core;

        if (!nextName || !nextCode || !nextCategory) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Subject name, code, and category are required.",
            });
        }

        const validCategories = [
            "Core",
            "Science",
            "Art",
            "Commercial",
            "Humanities",
            "Language",
            "Vocational",
            "Other",
        ];

        if (!validCategories.includes(nextCategory)) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Invalid subject category.",
            });
        }

        if (typeof nextIsCore !== "boolean") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "isCore must be a boolean.",
            });
        }

        let nextAcademicLevelIds = null;

        if (academicLevelIds !== undefined) {
            if (!Array.isArray(academicLevelIds)) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "academicLevelIds must be an array.",
                });
            }

            if (academicLevelIds.length === 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "A subject must be assigned to at least one academic level.",
                });
            }

            nextAcademicLevelIds = [
                ...new Set(academicLevelIds),
            ];

            if (
                nextAcademicLevelIds.length !==
                academicLevelIds.length
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "Duplicate academic level assignments are not allowed.",
                });
            }

            const academicLevelsResult =
                await client.query(
                    `
                    SELECT id
                    FROM academic_levels
                    WHERE school_id = $1
                      AND id = ANY($2::uuid[]);
                    `,
                    [
                        schoolId,
                        nextAcademicLevelIds,
                    ]
                );

            if (
                academicLevelsResult.rows.length !==
                nextAcademicLevelIds.length
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "One or more academic levels are invalid or do not belong to this school.",
                });
            }
        }

        const subjectResult = await client.query(
            `
            UPDATE subjects
            SET
                name = $1,
                code = $2,
                category = $3,
                is_core = $4,
                updated_at = NOW()
            WHERE id = $5
              AND school_id = $6
            RETURNING
                id,
                school_id,
                name,
                code,
                category,
                is_core,
                created_at,
                updated_at;
            `,
            [
                nextName,
                nextCode,
                nextCategory,
                nextIsCore,
                id,
                schoolId,
            ]
        );

        const subject = subjectResult.rows[0];

        if (nextAcademicLevelIds !== null) {
            await client.query(
                `
                DELETE FROM subject_academic_levels
                WHERE subject_id = $1
                  AND school_id = $2;
                `,
                [id, schoolId]
            );

            for (const academicLevelId of nextAcademicLevelIds) {
                await client.query(
                    `
                    INSERT INTO subject_academic_levels (
                        school_id,
                        subject_id,
                        academic_level_id
                    )
                    VALUES ($1, $2, $3);
                    `,
                    [
                        schoolId,
                        id,
                        academicLevelId,
                    ]
                );
            }
        }

        await client.query("COMMIT");

        let finalAcademicLevelIds =
            nextAcademicLevelIds;

        if (finalAcademicLevelIds === null) {
            const assignmentsResult =
                await pool.query(
                    `
                    SELECT academic_level_id
                    FROM subject_academic_levels
                    WHERE subject_id = $1
                      AND school_id = $2
                    ORDER BY created_at ASC;
                    `,
                    [id, schoolId]
                );

            finalAcademicLevelIds =
                assignmentsResult.rows.map(
                    (row) => row.academic_level_id
                );
        }

        return res.status(200).json({
            message: "Subject updated successfully.",
            subject,
            academicLevelIds:
                finalAcademicLevelIds,
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // Transaction may already have been rolled back.
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A subject with this name or code already exists in this school.",
            });
        }

        console.error(
            "Failed to update subject:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update subject.",
        });
    } finally {
        client.release();
    }
};



export const deleteSubject = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM subjects
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Subject not found.",
            });
        }

        return res.status(200).json({
            message: "Subject deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Subject cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete subject:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete subject.",
        });
    }
};
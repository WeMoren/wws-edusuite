import pool from "../config/db.js";

export const getStreams = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                s.id,
                s.school_id,
                s.name,
                s.code,
                s.description,
                s.is_active,
                s.created_at,
                s.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', al.id,
                            'name', al.name,
                            'category', al.category,
                            'displayOrder', al.display_order,
                            'isActive', sal.is_active
                        )
                        ORDER BY al.display_order ASC
                    ) FILTER (WHERE al.id IS NOT NULL),
                    '[]'
                ) AS academic_levels
            FROM streams s
            LEFT JOIN stream_academic_levels sal
                ON sal.stream_id = s.id
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
            streams: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch streams:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch streams.",
        });
    }
};

export const getStreamById = async (req, res) => {
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
                s.description,
                s.is_active,
                s.created_at,
                s.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', al.id,
                            'name', al.name,
                            'category', al.category,
                            'displayOrder', al.display_order,
                            'isActive', sal.is_active
                        )
                        ORDER BY al.display_order ASC
                    ) FILTER (WHERE al.id IS NOT NULL),
                    '[]'
                ) AS academic_levels
            FROM streams s
            LEFT JOIN stream_academic_levels sal
                ON sal.stream_id = s.id
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
                message: "Stream not found.",
            });
        }

        return res.status(200).json({
            stream: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch stream:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch stream.",
        });
    }
};

export const createStream = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            name,
            code,
            description,
            isActive,
            academicLevelIds,
        } = req.body;

        if (
            !name ||
            !code ||
            !Array.isArray(academicLevelIds) ||
            academicLevelIds.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Stream name, code, and at least one academic level are required.",
            });
        }

        if (
            isActive !== undefined &&
            typeof isActive !== "boolean"
        ) {
            return res.status(400).json({
                message: "isActive must be a boolean.",
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
                    "Academic level assignments must not contain duplicates.",
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
                    "One or more academic levels are invalid for this school.",
            });
        }

        const streamResult = await client.query(
            `
            INSERT INTO streams (
                school_id,
                name,
                code,
                description,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                school_id,
                name,
                code,
                description,
                is_active,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                name,
                code,
                description || null,
                isActive ?? true,
            ]
        );

        const stream = streamResult.rows[0];

        for (const academicLevelId of uniqueAcademicLevelIds) {
            await client.query(
                `
                INSERT INTO stream_academic_levels (
                    school_id,
                    stream_id,
                    academic_level_id
                )
                VALUES ($1, $2, $3);
                `,
                [
                    schoolId,
                    stream.id,
                    academicLevelId,
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Stream created successfully.",
            stream,
            academicLevelIds: uniqueAcademicLevelIds,
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Stream creation rollback failed:",
                rollbackError.message
            );
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A stream with this name or code already exists in this school.",
            });
        }

        console.error(
            "Failed to create stream:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create stream.",
        });
    } finally {
        client.release();
    }
};

export const updateStream = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            name,
            code,
            description,
            isActive,
            academicLevelIds,
        } = req.body;

        await client.query("BEGIN");

        const existingResult = await client.query(
            `
            SELECT
                name,
                code,
                description,
                is_active
            FROM streams
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Stream not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextName = name ?? existing.name;
        const nextCode = code ?? existing.code;
        const nextDescription =
            description ?? existing.description;
        const nextIsActive =
            isActive ?? existing.is_active;

        if (
            isActive !== undefined &&
            typeof isActive !== "boolean"
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "isActive must be a boolean.",
            });
        }

        let nextAcademicLevelIds;

        if (academicLevelIds !== undefined) {
            if (
                !Array.isArray(academicLevelIds) ||
                academicLevelIds.length === 0
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "At least one academic level is required.",
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
                        "Academic level assignments must not contain duplicates.",
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
                    [schoolId, nextAcademicLevelIds]
                );

            if (
                academicLevelsResult.rows.length !==
                nextAcademicLevelIds.length
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "One or more academic levels are invalid for this school.",
                });
            }
        }

        const streamResult = await client.query(
            `
            UPDATE streams
            SET
                name = $1,
                code = $2,
                description = $3,
                is_active = $4,
                updated_at = NOW()
            WHERE id = $5
              AND school_id = $6
            RETURNING
                id,
                school_id,
                name,
                code,
                description,
                is_active,
                created_at,
                updated_at;
            `,
            [
                nextName,
                nextCode,
                nextDescription,
                nextIsActive,
                id,
                schoolId,
            ]
        );

        if (academicLevelIds !== undefined) {
            await client.query(
                `
                DELETE FROM stream_academic_levels
                WHERE stream_id = $1
                  AND school_id = $2;
                `,
                [id, schoolId]
            );

            for (const academicLevelId of nextAcademicLevelIds) {
                await client.query(
                    `
                    INSERT INTO stream_academic_levels (
                        school_id,
                        stream_id,
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

        if (academicLevelIds === undefined) {
            const assignmentsResult =
                await pool.query(
                    `
                    SELECT academic_level_id
                    FROM stream_academic_levels
                    WHERE stream_id = $1
                      AND school_id = $2
                    ORDER BY created_at ASC;
                    `,
                    [id, schoolId]
                );

            nextAcademicLevelIds =
                assignmentsResult.rows.map(
                    (row) => row.academic_level_id
                );
        }

        return res.status(200).json({
            message: "Stream updated successfully.",
            stream: streamResult.rows[0],
            academicLevelIds: nextAcademicLevelIds,
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Stream update rollback failed:",
                rollbackError.message
            );
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A stream with this name or code already exists in this school.",
            });
        }

        console.error(
            "Failed to update stream:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update stream.",
        });
    } finally {
        client.release();
    }
};

export const deleteStream = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM streams
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Stream not found.",
            });
        }

        return res.status(200).json({
            message: "Stream deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Stream cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete stream:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete stream.",
        });
    }
};


import pool from "../config/db.js";

export const getSubjectCombinations = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                sc.id,
                sc.school_id,
                sc.academic_level_id,
                sc.stream_id,
                sc.name,
                sc.code,
                sc.is_active,
                sc.created_at,
                sc.updated_at,
                al.name AS academic_level_name,
                al.category AS academic_level_category,
                s.name AS stream_name,
                s.code AS stream_code,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', sub.id,
                            'name', sub.name,
                            'code', sub.code,
                            'category', sub.category,
                            'isCore', sub.is_core
                        )
                        ORDER BY sub.name ASC
                    ) FILTER (WHERE sub.id IS NOT NULL),
                    '[]'
                ) AS subjects
            FROM subject_combinations sc
            INNER JOIN academic_levels al
                ON al.id = sc.academic_level_id
                AND al.school_id = sc.school_id
            INNER JOIN streams s
                ON s.id = sc.stream_id
                AND s.school_id = sc.school_id
            LEFT JOIN subject_combination_subjects scs
                ON scs.subject_combination_id = sc.id
            LEFT JOIN subjects sub
                ON sub.id = scs.subject_id
                AND sub.school_id = sc.school_id
            WHERE sc.school_id = $1
            GROUP BY
                sc.id,
                al.name,
                al.category,
                s.name,
                s.code
            ORDER BY sc.name ASC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            subjectCombinations: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch subject combinations:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch subject combinations.",
        });
    }
};

export const getSubjectCombinationById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                sc.id,
                sc.school_id,
                sc.academic_level_id,
                sc.stream_id,
                sc.name,
                sc.code,
                sc.is_active,
                sc.created_at,
                sc.updated_at,
                al.name AS academic_level_name,
                al.category AS academic_level_category,
                s.name AS stream_name,
                s.code AS stream_code,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', sub.id,
                            'name', sub.name,
                            'code', sub.code,
                            'category', sub.category,
                            'isCore', sub.is_core
                        )
                        ORDER BY sub.name ASC
                    ) FILTER (WHERE sub.id IS NOT NULL),
                    '[]'
                ) AS subjects
            FROM subject_combinations sc
            INNER JOIN academic_levels al
                ON al.id = sc.academic_level_id
                AND al.school_id = sc.school_id
            INNER JOIN streams s
                ON s.id = sc.stream_id
                AND s.school_id = sc.school_id
            LEFT JOIN subject_combination_subjects scs
                ON scs.subject_combination_id = sc.id
            LEFT JOIN subjects sub
                ON sub.id = scs.subject_id
                AND sub.school_id = sc.school_id
            WHERE sc.id = $1
              AND sc.school_id = $2
            GROUP BY
                sc.id,
                al.name,
                al.category,
                s.name,
                s.code;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Subject combination not found.",
            });
        }

        return res.status(200).json({
            subjectCombination: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch subject combination:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch subject combination.",
        });
    }
};

export const createSubjectCombination = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            academicLevelId,
            streamId,
            name,
            code,
            isActive,
            subjectIds,
        } = req.body;

        if (
            !academicLevelId ||
            !streamId ||
            !name ||
            !code ||
            !Array.isArray(subjectIds) ||
            subjectIds.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Academic level, stream, name, code, and at least one subject are required.",
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

        const uniqueSubjectIds = [
            ...new Set(subjectIds),
        ];

        if (
            uniqueSubjectIds.length !== subjectIds.length
        ) {
            return res.status(400).json({
                message:
                    "Subject assignments must not contain duplicates.",
            });
        }

        await client.query("BEGIN");

        const academicLevelResult = await client.query(
            `
            SELECT id
            FROM academic_levels
            WHERE id = $1
              AND school_id = $2;
            `,
            [academicLevelId, schoolId]
        );

        if (academicLevelResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Academic level is invalid for this school.",
            });
        }

        const streamResult = await client.query(
            `
            SELECT id
            FROM streams
            WHERE id = $1
              AND school_id = $2;
            `,
            [streamId, schoolId]
        );

        if (streamResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Stream is invalid for this school.",
            });
        }

        const streamAssignmentResult =
            await client.query(
                `
                SELECT id
                FROM stream_academic_levels
                WHERE stream_id = $1
                  AND academic_level_id = $2
                  AND school_id = $3
                  AND is_active = TRUE;
                `,
                [
                    streamId,
                    academicLevelId,
                    schoolId,
                ]
            );

        if (streamAssignmentResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "The selected stream is not assigned to the selected academic level.",
            });
        }

        const subjectsResult = await client.query(
            `
            SELECT id
            FROM subjects
            WHERE school_id = $1
              AND id = ANY($2::uuid[]);
            `,
            [schoolId, uniqueSubjectIds]
        );

        if (
            subjectsResult.rows.length !==
            uniqueSubjectIds.length
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "One or more subjects are invalid for this school.",
            });
        }

        const subjectLevelResult =
            await client.query(
                `
                SELECT DISTINCT subject_id
                FROM subject_academic_levels
                WHERE school_id = $1
                  AND academic_level_id = $2
                  AND subject_id = ANY($3::uuid[]);
                `,
                [
                    schoolId,
                    academicLevelId,
                    uniqueSubjectIds,
                ]
            );

        if (
            subjectLevelResult.rows.length !==
            uniqueSubjectIds.length
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "One or more subjects are not assigned to the selected academic level.",
            });
        }

        const combinationResult =
            await client.query(
                `
                INSERT INTO subject_combinations (
                    school_id,
                    academic_level_id,
                    stream_id,
                    name,
                    code,
                    is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING
                    id,
                    school_id,
                    academic_level_id,
                    stream_id,
                    name,
                    code,
                    is_active,
                    created_at,
                    updated_at;
                `,
                [
                    schoolId,
                    academicLevelId,
                    streamId,
                    name,
                    code,
                    isActive ?? true,
                ]
            );

        const subjectCombination =
            combinationResult.rows[0];

        for (const subjectId of uniqueSubjectIds) {
            await client.query(
                `
                INSERT INTO subject_combination_subjects (
                    school_id,
                    subject_combination_id,
                    subject_id
                )
                VALUES ($1, $2, $3);
                `,
                [
                    schoolId,
                    subjectCombination.id,
                    subjectId,
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message:
                "Subject combination created successfully.",
            subjectCombination,
            subjectIds: uniqueSubjectIds,
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Subject combination creation rollback failed:",
                rollbackError.message
            );
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A subject combination with this name or code already exists for this academic level and stream.",
            });
        }

        console.error(
            "Failed to create subject combination:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to create subject combination.",
        });
    } finally {
        client.release();
    }
};

export const updateSubjectCombination = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            academicLevelId,
            streamId,
            name,
            code,
            isActive,
            subjectIds,
        } = req.body;

        await client.query("BEGIN");

        const existingResult = await client.query(
            `
            SELECT
                academic_level_id,
                stream_id,
                name,
                code,
                is_active
            FROM subject_combinations
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Subject combination not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextAcademicLevelId =
            academicLevelId ??
            existing.academic_level_id;

        const nextStreamId =
            streamId ?? existing.stream_id;

        const nextName =
            name ?? existing.name;

        const nextCode =
            code ?? existing.code;

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

        let nextSubjectIds;

        if (subjectIds !== undefined) {
            if (
                !Array.isArray(subjectIds) ||
                subjectIds.length === 0
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "At least one subject is required.",
                });
            }

            nextSubjectIds = [
                ...new Set(subjectIds),
            ];

            if (
                nextSubjectIds.length !==
                subjectIds.length
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "Subject assignments must not contain duplicates.",
                });
            }
        }

        const academicLevelResult =
            await client.query(
                `
                SELECT id
                FROM academic_levels
                WHERE id = $1
                  AND school_id = $2;
                `,
                [
                    nextAcademicLevelId,
                    schoolId,
                ]
            );

        if (academicLevelResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Academic level is invalid for this school.",
            });
        }

        const streamResult =
            await client.query(
                `
                SELECT id
                FROM streams
                WHERE id = $1
                  AND school_id = $2;
                `,
                [
                    nextStreamId,
                    schoolId,
                ]
            );

        if (streamResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Stream is invalid for this school.",
            });
        }

        const streamAssignmentResult =
            await client.query(
                `
                SELECT id
                FROM stream_academic_levels
                WHERE stream_id = $1
                  AND academic_level_id = $2
                  AND school_id = $3
                  AND is_active = TRUE;
                `,
                [
                    nextStreamId,
                    nextAcademicLevelId,
                    schoolId,
                ]
            );

        if (streamAssignmentResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "The selected stream is not assigned to the selected academic level.",
            });
        }

        if (subjectIds !== undefined) {
            const subjectsResult =
                await client.query(
                    `
                    SELECT id
                    FROM subjects
                    WHERE school_id = $1
                      AND id = ANY($2::uuid[]);
                    `,
                    [
                        schoolId,
                        nextSubjectIds,
                    ]
                );

            if (
                subjectsResult.rows.length !==
                nextSubjectIds.length
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "One or more subjects are invalid for this school.",
                });
            }

            const subjectLevelResult =
                await client.query(
                    `
                    SELECT DISTINCT subject_id
                    FROM subject_academic_levels
                    WHERE school_id = $1
                      AND academic_level_id = $2
                      AND subject_id = ANY($3::uuid[]);
                    `,
                    [
                        schoolId,
                        nextAcademicLevelId,
                        nextSubjectIds,
                    ]
                );

            if (
                subjectLevelResult.rows.length !==
                nextSubjectIds.length
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "One or more subjects are not assigned to the selected academic level.",
                });
            }
        }

        const combinationResult =
            await client.query(
                `
                UPDATE subject_combinations
                SET
                    academic_level_id = $1,
                    stream_id = $2,
                    name = $3,
                    code = $4,
                    is_active = $5,
                    updated_at = NOW()
                WHERE id = $6
                  AND school_id = $7
                RETURNING
                    id,
                    school_id,
                    academic_level_id,
                    stream_id,
                    name,
                    code,
                    is_active,
                    created_at,
                    updated_at;
                `,
                [
                    nextAcademicLevelId,
                    nextStreamId,
                    nextName,
                    nextCode,
                    nextIsActive,
                    id,
                    schoolId,
                ]
            );

        if (subjectIds !== undefined) {
            await client.query(
                `
                DELETE FROM subject_combination_subjects
                WHERE subject_combination_id = $1
                  AND school_id = $2;
                `,
                [id, schoolId]
            );

            for (const subjectId of nextSubjectIds) {
                await client.query(
                    `
                    INSERT INTO subject_combination_subjects (
                        school_id,
                        subject_combination_id,
                        subject_id
                    )
                    VALUES ($1, $2, $3);
                    `,
                    [
                        schoolId,
                        id,
                        subjectId,
                    ]
                );
            }
        }

        await client.query("COMMIT");

        if (subjectIds === undefined) {
            const assignmentsResult =
                await pool.query(
                    `
                    SELECT subject_id
                    FROM subject_combination_subjects
                    WHERE subject_combination_id = $1
                      AND school_id = $2
                    ORDER BY created_at ASC;
                    `,
                    [id, schoolId]
                );

            nextSubjectIds =
                assignmentsResult.rows.map(
                    (row) => row.subject_id
                );
        }

        return res.status(200).json({
            message:
                "Subject combination updated successfully.",
            subjectCombination:
                combinationResult.rows[0],
            subjectIds: nextSubjectIds,
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Subject combination update rollback failed:",
                rollbackError.message
            );
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A subject combination with this name or code already exists for this academic level and stream.",
            });
        }

        console.error(
            "Failed to update subject combination:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to update subject combination.",
        });
    } finally {
        client.release();
    }
};

export const deleteSubjectCombination = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM subject_combinations
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Subject combination not found.",
            });
        }

        return res.status(200).json({
            message:
                "Subject combination deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Subject combination cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete subject combination:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to delete subject combination.",
        });
    }
};

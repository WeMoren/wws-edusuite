import pool from "../config/db.js";
import {
    StudentPromotionCriteriaManagementError,
    validateAcademicLevelCombinationRequirement,
} from "../services/studentPromotionCriteriaManagementService.js";

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
                 requires_subject_combination,
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
                requires_subject_combination,
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

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        await client.query(
            `
            SELECT id
            FROM schools
            WHERE id = $1
            FOR UPDATE;
            `,
            [schoolId]
        );

        const orderResult = await client.query(
            `
            SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
            FROM academic_levels
            WHERE school_id = $1;
            `,
            [schoolId]
        );

        const nextDisplayOrder = Number(
            orderResult.rows[0].next_order
        );

        if (nextDisplayOrder > 2147483647) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "No additional academic level positions are available.",
            });
        }

        const result = await client.query(
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
                nextDisplayOrder,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Academic level created successfully.",
            level: result.rows[0],
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Failed to roll back academic level creation:",
                    rollbackError.message
                );
            }
        }

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
    } finally {
        client?.release();
    }
};




export const updateAcademicLevel = async (req, res) => {
    const { schoolId } = req;
    const { id } = req.params;

    const {
        name,
        category,
        displayOrder,
        requiresSubjectCombination,
    } = req.body;


    if (
    requiresSubjectCombination !== undefined &&
    typeof requiresSubjectCombination !== "boolean"
) {
    return res.status(400).json({
        message:
            "Subject combination requirement must be a boolean.",
    });
}

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const schoolResult = await client.query(
            `
            SELECT id
            FROM schools
            WHERE id = $1
            FOR UPDATE;
            `,
            [schoolId]
        );

        if (schoolResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "School not found.",
            });
        }

        const existingResult = await client.query(
            `
            SELECT
                name,
                category,
                display_order,
                requires_subject_combination
            FROM academic_levels
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

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

            const nextRequiresSubjectCombination =
                requiresSubjectCombination ??
                existing.requires_subject_combination;

        if (
            !Number.isInteger(nextDisplayOrder) ||
            nextDisplayOrder <= 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Display order must be a positive integer.",
            });
        }

        const result = await client.query(
            `
            UPDATE academic_levels
            SET
                name = $1,
                category = $2,
                display_order = $3,
                requires_subject_combination = $4,
                updated_at = NOW()
            WHERE id = $5
            AND school_id = $6
            RETURNING
                id,
                school_id,
                name,
                category,
                display_order,
                requires_subject_combination,
                created_at,
                updated_at;
            `,
            [
                nextName,
                nextCategory,
                nextDisplayOrder,
                nextRequiresSubjectCombination,
                id,
                schoolId,
            ]
                );

        if (
            !existing.requires_subject_combination
            && nextRequiresSubjectCombination
        ) {
            await validateAcademicLevelCombinationRequirement(
                client,
                {
                    schoolId,
                    academicLevelId: id,
                }
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Academic level updated successfully.",
            level: result.rows[0],
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Failed to roll back academic level update:",
                    rollbackError.message
                );
            }
        }

                if (
            error instanceof StudentPromotionCriteriaManagementError
        ) {
            return res.status(error.statusCode).json({
                message: error.message,
                details: error.details,
            });
        }

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
    } finally {
        client?.release();
    }
};



export const deleteAcademicLevel = async (req, res) => {
    const { schoolId } = req;
    const { id } = req.params;

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const schoolResult = await client.query(
            `
            SELECT id
            FROM schools
            WHERE id = $1
            FOR UPDATE;
            `,
            [schoolId]
        );

        if (schoolResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "School not found.",
            });
        }

        const result = await client.query(
            `
            DELETE FROM academic_levels
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Academic level not found.",
            });
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Academic level deleted successfully.",
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Failed to roll back academic level deletion:",
                    rollbackError.message
                );
            }
        }

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
    } finally {
        client?.release();
    }
};



export const reorderAcademicLevels = async (req, res) => {
    const { schoolId } = req;
    const { levelIds } = req.body;

    if (
        !Array.isArray(levelIds) ||
        !levelIds.every((id) => typeof id === "string")
    ) {
        return res.status(400).json({
            message: "A valid ordered list of academic level IDs is required.",
        });
    }

    if (new Set(levelIds).size !== levelIds.length) {
        return res.status(400).json({
            message: "The academic level list contains duplicate IDs.",
        });
    }

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const schoolResult = await client.query(
            `
            SELECT id
            FROM schools
            WHERE id = $1
            FOR UPDATE;
            `,
            [schoolId]
        );

        if (schoolResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "School not found.",
            });
        }

        const existingResult = await client.query(
            `
            SELECT id, display_order
            FROM academic_levels
            WHERE school_id = $1
            ORDER BY display_order ASC
            FOR UPDATE;
            `,
            [schoolId]
        );

        const existingIds = existingResult.rows.map(
            (level) => level.id
        );

        const existingIdSet = new Set(existingIds);

        const isCompleteSequence =
            levelIds.length === existingIds.length &&
            levelIds.every((id) => existingIdSet.has(id));

        if (!isCompleteSequence) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "The submitted sequence must contain every academic level belonging to this school exactly once.",
            });
        }

        const maximumOrder = existingResult.rows.reduce(
            (maximum, level) =>
                Math.max(maximum, Number(level.display_order)),
            0
        );

        const temporaryOrderStart =
            maximumOrder + existingIds.length;

        const maximumInteger = 2147483647;

        if (
            temporaryOrderStart + existingIds.length >
            maximumInteger
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "The academic level sequence cannot be reordered because its display order exceeds the supported range.",
            });
        }

        for (let index = 0; index < levelIds.length; index += 1) {
            await client.query(
                `
                UPDATE academic_levels
                SET
                    display_order = $1,
                    updated_at = NOW()
                WHERE id = $2
                  AND school_id = $3;
                `,
                [
                    temporaryOrderStart + index + 1,
                    levelIds[index],
                    schoolId,
                ]
            );
        }

        for (let index = 0; index < levelIds.length; index += 1) {
            await client.query(
                `
                UPDATE academic_levels
                SET
                    display_order = $1,
                    updated_at = NOW()
                WHERE id = $2
                  AND school_id = $3;
                `,
                [
                    index + 1,
                    levelIds[index],
                    schoolId,
                ]
            );
        }

        const reorderedResult = await client.query(
            `
            SELECT
                id,
                school_id,
                name,
                category,
                display_order,
                requires_subject_combination,
                created_at,
                updated_at
            FROM academic_levels
            WHERE school_id = $1
            ORDER BY display_order ASC;
            `,
            [schoolId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Academic levels reordered successfully.",
            levels: reorderedResult.rows,
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Failed to roll back academic level reorder:",
                    rollbackError.message
                );
            }
        }

        console.error(
            "Failed to reorder academic levels:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to reorder academic levels.",
        });
    } finally {
        client?.release();
    }
};

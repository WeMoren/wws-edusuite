import pool from "../config/db.js";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidStudentIds = (studentIds) =>
    Array.isArray(studentIds) &&
    studentIds.every(
        (id) => typeof id === "string" && UUID_PATTERN.test(id)
    ) &&
    new Set(studentIds).size === studentIds.length;

const parentSelect = `
    SELECT
        p.id,
        p.school_id,
        p.first_name,
        p.last_name,
        p.phone,
        p.email,
        p.address,
        p.created_at,
        p.updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'admission_no', s.admission_no,
                    'first_name', s.first_name,
                    'last_name', s.last_name,
                    'status', s.status,
                    'relationship', psr.relationship
                )
                ORDER BY s.last_name, s.first_name
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'::jsonb
        ) AS children
    FROM parents p
    LEFT JOIN parent_student_relationships psr
        ON psr.school_id = p.school_id
       AND psr.parent_id = p.id
    LEFT JOIN students s
        ON s.school_id = psr.school_id
       AND s.id = psr.student_id
`;

const groupParentRows = `
    GROUP BY
        p.id,
        p.school_id,
        p.first_name,
        p.last_name,
        p.phone,
        p.email,
        p.address,
        p.created_at,
        p.updated_at
`;

const validateStudentOwnership = async (
    client,
    schoolId,
    studentIds
) => {
    if (studentIds.length === 0) {
        return true;
    }

    const result = await client.query(
        `
        SELECT id
        FROM students
        WHERE school_id = $1
          AND id = ANY($2::uuid[]);
        `,
        [schoolId, studentIds]
    );

    return result.rows.length === studentIds.length;
};

export const getParents = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            ${parentSelect}
            WHERE p.school_id = $1
            ${groupParentRows}
            ORDER BY p.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            parents: result.rows,
        });
    } catch (error) {
        console.error("Failed to fetch parents:", error.message);

        return res.status(500).json({
            message: "Failed to fetch parents.",
        });
    }
};

export const getParentById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        if (!UUID_PATTERN.test(id)) {
            return res.status(400).json({
                message: "Invalid parent ID.",
            });
        }

        const result = await pool.query(
            `
            ${parentSelect}
            WHERE p.school_id = $1
              AND p.id = $2
            ${groupParentRows};
            `,
            [schoolId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Parent not found.",
            });
        }

        return res.status(200).json({
            parent: result.rows[0],
        });
    } catch (error) {
        console.error("Failed to fetch parent:", error.message);

        return res.status(500).json({
            message: "Failed to fetch parent.",
        });
    }
};

export const createParent = async (req, res) => {
    let client;
    let transactionActive = false;

    try {
        client = await pool.connect();
        const { schoolId } = req;
        const {
            firstName,
            lastName,
            phone,
            email = null,
            address = null,
            studentIds = [],
            relationship = "Guardian",
        } = req.body;

        if (
            typeof firstName !== "string" ||
            !firstName.trim() ||
            typeof lastName !== "string" ||
            !lastName.trim() ||
            typeof phone !== "string" ||
            !phone.trim()
        ) {
            return res.status(400).json({
                message:
                    "First name, last name, and phone number are required.",
            });
        }

        if (
            typeof email !== "string" && email !== null ||
            typeof address !== "string" && address !== null
        ) {
            return res.status(400).json({
                message: "Invalid email or address.",
            });
        }

        if (
            !isValidStudentIds(studentIds) ||
            typeof relationship !== "string" ||
            !relationship.trim() ||
            relationship.trim().length > 50
        ) {
            return res.status(400).json({
                message: "Invalid student selection or relationship.",
            });
        }

        await client.query("BEGIN");
        transactionActive = true;

        const studentsValid = await validateStudentOwnership(
            client,
            schoolId,
            studentIds
        );

        if (!studentsValid) {
            await client.query("ROLLBACK");
            transactionActive = false;

            return res.status(400).json({
                message:
                    "One or more selected students do not belong to this school.",
            });
        }

        const result = await client.query(
            `
            INSERT INTO parents (
                school_id,
                first_name,
                last_name,
                phone,
                email,
                address
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
            `,
            [
                schoolId,
                firstName.trim(),
                lastName.trim(),
                phone.trim(),
                email?.trim() || null,
                address?.trim() || null,
            ]
        );

        const parent = result.rows[0];

        if (studentIds.length > 0) {
            await client.query(
                `
                INSERT INTO parent_student_relationships (
                    school_id,
                    parent_id,
                    student_id,
                    relationship
                )
                SELECT $1, $2, student_id, $4
                FROM unnest($3::uuid[]) AS selected(student_id);
                `,
                [
                    schoolId,
                    parent.id,
                    studentIds,
                    relationship.trim(),
                ]
            );
        }

        await client.query("COMMIT");
        transactionActive = false;

        const createdParent = await client.query(
            `
            ${parentSelect}
            WHERE p.school_id = $1 AND p.id = $2
            ${groupParentRows};
            `,
            [schoolId, parent.id]
        );

        return res.status(201).json({
            message: "Parent created successfully.",
            parent: createdParent.rows[0],
        });
    } catch (error) {

               if (transactionActive) {
            try {
                await client.query("ROLLBACK");
                transactionActive = false;
            } catch (rollbackError) {
                console.error(
                    "Parent creation rollback failed:",
                    rollbackError.message
                );
            }
        }

        console.error("Failed to create parent:", error.message);

        return res.status(500).json({
            message: "Failed to create parent.",
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const updateParent = async (req, res) => {
    let client;
    let transactionActive = false;

    try {
         client = await pool.connect();
        const { schoolId } = req;
        const { id } = req.params;
        const {
            firstName,
            lastName,
            phone,
            email,
            address,
            studentIds,
            relationship = "Guardian",
        } = req.body;

        if (!UUID_PATTERN.test(id)) {
            return res.status(400).json({
                message: "Invalid parent ID.",
            });
        }

        if (
            firstName !== undefined &&
            (typeof firstName !== "string" || !firstName.trim()) ||
            lastName !== undefined &&
            (typeof lastName !== "string" || !lastName.trim()) ||
            phone !== undefined &&
            (typeof phone !== "string" || !phone.trim())
        ) {
            return res.status(400).json({
                message: "Name and phone fields cannot be empty.",
            });
        }

        if (
            email !== undefined &&
            email !== null &&
            typeof email !== "string" ||
            address !== undefined &&
            address !== null &&
            typeof address !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid email or address.",
            });
        }

        if (
            studentIds !== undefined &&
            !isValidStudentIds(studentIds)
        ) {
            return res.status(400).json({
                message: "Invalid student selection.",
            });
        }

        if (
            typeof relationship !== "string" ||
            !relationship.trim() ||
            relationship.trim().length > 50
        ) {
            return res.status(400).json({
                message: "Invalid relationship.",
            });
        }

        await client.query("BEGIN");
        transactionActive = true;

        const existing = await client.query(
            `
            SELECT id
            FROM parents
            WHERE id = $1 AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (existing.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionActive = false;

            return res.status(404).json({
                message: "Parent not found.",
            });
        }

        if (studentIds !== undefined) {
            const studentsValid = await validateStudentOwnership(
                client,
                schoolId,
                studentIds
            );

            if (!studentsValid) {
                await client.query("ROLLBACK");
            transactionActive = false;

                return res.status(400).json({
                    message:
                        "One or more selected students do not belong to this school.",
                });
            }
        }

        const updated = await client.query(
            `
            UPDATE parents
            SET
                first_name = COALESCE($3, first_name),
                last_name = COALESCE($4, last_name),
                phone = COALESCE($5, phone),
                email = CASE WHEN $6 THEN $7 ELSE email END,
                address = CASE WHEN $8 THEN $9 ELSE address END,
                updated_at = NOW()
            WHERE id = $1 AND school_id = $2
            RETURNING *;
            `,
            [
                id,
                schoolId,
                firstName?.trim() ?? null,
                lastName?.trim() ?? null,
                phone?.trim() ?? null,
                email !== undefined,
                email?.trim() || null,
                address !== undefined,
                address?.trim() || null,
            ]
        );

        if (studentIds !== undefined) {
            await client.query(
                `
                DELETE FROM parent_student_relationships
                WHERE school_id = $1 AND parent_id = $2;
                `,
                [schoolId, id]
            );

            if (studentIds.length > 0) {
                await client.query(
                    `
                    INSERT INTO parent_student_relationships (
                        school_id,
                        parent_id,
                        student_id,
                        relationship
                    )
                    SELECT $1, $2, student_id, $4
                    FROM unnest($3::uuid[]) AS selected(student_id);
                    `,
                    [
                        schoolId,
                        id,
                        studentIds,
                        relationship.trim(),
                    ]
                );
            }
        }

        await client.query("COMMIT");
        transactionActive = false;

        return res.status(200).json({
            message: "Parent updated successfully.",
            parent: updated.rows[0],
        });
    } catch (error) {

                if (transactionActive) {
            try {
                await client.query("ROLLBACK");
                transactionActive = false;
            } catch (rollbackError) {
                console.error(
                    "Parent update rollback failed:",
                    rollbackError.message
                );
            }
        }

        console.error("Failed to update parent:", error.message);

        return res.status(500).json({
            message: "Failed to update parent.",
        });
    } finally {
       if (client) {
            client.release();
        }
    }
};

export const deleteParent = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        if (!UUID_PATTERN.test(id)) {
            return res.status(400).json({
                message: "Invalid parent ID.",
            });
        }

        const result = await pool.query(
            `
            DELETE FROM parents
            WHERE id = $1 AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Parent not found.",
            });
        }

        return res.status(200).json({
            message: "Parent deleted successfully.",
        });
    } catch (error) {
        console.error("Failed to delete parent:", error.message);

        return res.status(500).json({
            message: "Failed to delete parent.",
        });
    }
};

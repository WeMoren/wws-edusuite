import pool from "../config/db.js";

export const getFeeStructures = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                fs.id,
                fs.school_id,
                fs.academic_session_id,
                fs.term_id,
                fs.academic_level_id,
                fs.name,
                fs.is_current,
                fs.created_at,
                fs.updated_at,

                a.name AS academic_session_name,

                t.name AS term_name,
                t.display_order AS term_display_order,

                al.name AS academic_level_name,

                COALESCE(
                    SUM(fsi.amount),
                    0
                ) AS total_amount,

                COUNT(fsi.id)::INTEGER AS item_count

            FROM fee_structures fs

            JOIN academic_sessions a
                ON a.id = fs.academic_session_id

            JOIN terms t
                ON t.id = fs.term_id

            JOIN academic_levels al
                ON al.id = fs.academic_level_id

            LEFT JOIN fee_structure_items fsi
                ON fsi.fee_structure_id = fs.id

            WHERE fs.school_id = $1

            GROUP BY
                fs.id,
                a.name,
                a.start_date,
                t.name,
                t.display_order,
                al.name,
                al.display_order

            ORDER BY
                a.start_date DESC,
                t.display_order ASC,
                al.display_order ASC,
                fs.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            feeStructures: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch fee structures:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch fee structures.",
        });
    }
};

export const getFeeStructureById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const structureResult = await pool.query(
            `
            SELECT
                fs.id,
                fs.school_id,
                fs.academic_session_id,
                fs.term_id,
                fs.academic_level_id,
                fs.name,
                fs.is_current,
                fs.created_at,
                fs.updated_at,

                a.name AS academic_session_name,

                t.name AS term_name,
                t.display_order AS term_display_order,

                al.name AS academic_level_name

            FROM fee_structures fs

            JOIN academic_sessions a
                ON a.id = fs.academic_session_id

            JOIN terms t
                ON t.id = fs.term_id

            JOIN academic_levels al
                ON al.id = fs.academic_level_id

            WHERE fs.id = $1
              AND fs.school_id = $2;
            `,
            [id, schoolId]
        );

        if (structureResult.rows.length === 0) {
            return res.status(404).json({
                message: "Fee structure not found.",
            });
        }

        const itemsResult = await pool.query(
            `
            SELECT
                id,
                fee_structure_id,
                name,
                amount,
                display_order,
                created_at,
                updated_at
            FROM fee_structure_items
            WHERE fee_structure_id = $1
            ORDER BY display_order ASC;
            `,
            [id]
        );

        const totalAmount = itemsResult.rows.reduce(
            (total, item) =>
                total + Number(item.amount),
            0
        );

        return res.status(200).json({
            feeStructure: {
                ...structureResult.rows[0],
                items: itemsResult.rows,
                total_amount: totalAmount.toFixed(2),
            },
        });
    } catch (error) {
        console.error(
            "Failed to fetch fee structure:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch fee structure.",
        });
    }
};

export const createFeeStructure = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            academicSessionId,
            termId,
            academicLevelId,
            name,
            items,
            isCurrent = true,
        } = req.body;

        if (
            !academicSessionId ||
            !termId ||
            !academicLevelId ||
            !name ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Academic session, term, academic level, name, and at least one fee item are required.",
            });
        }

        if (typeof isCurrent !== "boolean") {
            return res.status(400).json({
                message:
                    "isCurrent must be a boolean.",
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
                message: "Academic session not found.",
            });
        }

        /*
         * Validate that the term belongs to the
         * selected academic session.
         */
        const termResult = await client.query(
            `
            SELECT id
            FROM terms
            WHERE id = $1
              AND academic_session_id = $2;
            `,
            [termId, academicSessionId]
        );

        if (termResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Term not found for the selected academic session.",
            });
        }

        /*
         * Validate that the academic level belongs
         * to this school.
         */
        const levelResult = await client.query(
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

        /*
         * Validate every fee item before starting
         * the database transaction.
         */
        const itemNames = new Set();
        const displayOrders = new Set();

        for (const item of items) {
            const {
                name: itemName,
                amount,
                displayOrder,
            } = item;

            if (
                !itemName ||
                amount === undefined ||
                displayOrder === undefined
            ) {
                return res.status(400).json({
                    message:
                        "Each fee item requires a name, amount, and display order.",
                });
            }

            if (
                typeof amount !== "number" ||
                !Number.isFinite(amount) ||
                amount < 0
            ) {
                return res.status(400).json({
                    message:
                        "Fee item amount must be a valid non-negative number.",
                });
            }

            if (
                !Number.isInteger(displayOrder) ||
                displayOrder <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Fee item display order must be a positive integer.",
                });
            }

            if (itemNames.has(itemName)) {
                return res.status(409).json({
                    message:
                        "Fee item names must be unique within a fee structure.",
                });
            }

            if (displayOrders.has(displayOrder)) {
                return res.status(409).json({
                    message:
                        "Fee item display orders must be unique within a fee structure.",
                });
            }

            itemNames.add(itemName);
            displayOrders.add(displayOrder);
        }

        await client.query("BEGIN");

        const structureResult = await client.query(
            `
            INSERT INTO fee_structures (
                school_id,
                academic_session_id,
                term_id,
                academic_level_id,
                name,
                is_current
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                school_id,
                academic_session_id,
                term_id,
                academic_level_id,
                name,
                is_current,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                academicSessionId,
                termId,
                academicLevelId,
                name,
                isCurrent,
            ]
        );

        const feeStructure =
            structureResult.rows[0];

        const itemRows = [];

        for (const item of items) {
            const itemResult = await client.query(
                `
                INSERT INTO fee_structure_items (
                    fee_structure_id,
                    name,
                    amount,
                    display_order
                )
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    fee_structure_id,
                    name,
                    amount,
                    display_order,
                    created_at,
                    updated_at;
                `,
                [
                    feeStructure.id,
                    item.name,
                    item.amount,
                    item.displayOrder,
                ]
            );

            itemRows.push(itemResult.rows[0]);
        }

        await client.query("COMMIT");

        const totalAmount = itemRows.reduce(
            (total, item) =>
                total + Number(item.amount),
            0
        );

        return res.status(201).json({
            message:
                "Fee structure created successfully.",
            feeStructure: {
                ...feeStructure,
                items: itemRows,
                total_amount:
                    totalAmount.toFixed(2),
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A fee structure with this name already exists for this academic session, term, and academic level.",
            });
        }

        console.error(
            "Failed to create fee structure:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to create fee structure.",
        });
    } finally {
        client.release();
    }
};

export const updateFeeStructure = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            name,
            isCurrent,
            items,
        } = req.body;

        const existingResult = await pool.query(
            `
            SELECT
                id,
                name,
                is_current
            FROM fee_structures
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Fee structure not found.",
            });
        }

        /*
         * Once financial accounts reference a fee
         * structure, its financial definition becomes
         * historical and must not be silently changed.
         */
        const accountResult = await pool.query(
            `
            SELECT id
            FROM student_financial_accounts
            WHERE fee_structure_id = $1
            LIMIT 1;
            `,
            [id]
        );

        if (accountResult.rows.length > 0) {
            return res.status(409).json({
                message:
                    "Fee structure cannot be modified because financial accounts already reference it. Create a new fee structure instead.",
            });
        }

        const existing =
            existingResult.rows[0];

        const nextName =
            name ?? existing.name;

        const nextIsCurrent =
            isCurrent ?? existing.is_current;

        if (typeof nextIsCurrent !== "boolean") {
            return res.status(400).json({
                message:
                    "isCurrent must be a boolean.",
            });
        }

        if (items !== undefined) {
            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {
                return res.status(400).json({
                    message:
                        "Fee items must be a non-empty array.",
                });
            }

            const itemNames = new Set();
            const displayOrders = new Set();

            for (const item of items) {
                const {
                    name: itemName,
                    amount,
                    displayOrder,
                } = item;

                if (
                    !itemName ||
                    amount === undefined ||
                    displayOrder === undefined
                ) {
                    return res.status(400).json({
                        message:
                            "Each fee item requires a name, amount, and display order.",
                    });
                }

                if (
                    typeof amount !== "number" ||
                    !Number.isFinite(amount) ||
                    amount < 0
                ) {
                    return res.status(400).json({
                        message:
                            "Fee item amount must be a valid non-negative number.",
                    });
                }

                if (
                    !Number.isInteger(displayOrder) ||
                    displayOrder <= 0
                ) {
                    return res.status(400).json({
                        message:
                            "Fee item display order must be a positive integer.",
                    });
                }

                if (itemNames.has(itemName)) {
                    return res.status(409).json({
                        message:
                            "Fee item names must be unique within a fee structure.",
                    });
                }

                if (displayOrders.has(displayOrder)) {
                    return res.status(409).json({
                        message:
                            "Fee item display orders must be unique within a fee structure.",
                    });
                }

                itemNames.add(itemName);
                displayOrders.add(displayOrder);
            }
        }

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const structureResult =
                await client.query(
                    `
                    UPDATE fee_structures
                    SET
                        name = $1,
                        is_current = $2,
                        updated_at = NOW()
                    WHERE id = $3
                      AND school_id = $4
                    RETURNING
                        id,
                        school_id,
                        academic_session_id,
                        term_id,
                        academic_level_id,
                        name,
                        is_current,
                        created_at,
                        updated_at;
                    `,
                    [
                        nextName,
                        nextIsCurrent,
                        id,
                        schoolId,
                    ]
                );

            if (items !== undefined) {
                await client.query(
                    `
                    DELETE FROM fee_structure_items
                    WHERE fee_structure_id = $1;
                    `,
                    [id]
                );

                for (const item of items) {
                    await client.query(
                        `
                        INSERT INTO fee_structure_items (
                            fee_structure_id,
                            name,
                            amount,
                            display_order
                        )
                        VALUES ($1, $2, $3, $4);
                        `,
                        [
                            id,
                            item.name,
                            item.amount,
                            item.displayOrder,
                        ]
                    );
                }
            }

            const itemsResult =
                await client.query(
                    `
                    SELECT
                        id,
                        fee_structure_id,
                        name,
                        amount,
                        display_order,
                        created_at,
                        updated_at
                    FROM fee_structure_items
                    WHERE fee_structure_id = $1
                    ORDER BY display_order ASC;
                    `,
                    [id]
                );

            await client.query("COMMIT");

            const totalAmount =
                itemsResult.rows.reduce(
                    (total, item) =>
                        total + Number(item.amount),
                    0
                );

            return res.status(200).json({
                message:
                    "Fee structure updated successfully.",
                feeStructure: {
                    ...structureResult.rows[0],
                    items: itemsResult.rows,
                    total_amount:
                        totalAmount.toFixed(2),
                },
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A fee structure with this name already exists for this academic session, term, and academic level.",
            });
        }

        console.error(
            "Failed to update fee structure:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to update fee structure.",
        });
    }
};

export const deleteFeeStructure = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM fee_structures
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Fee structure not found.",
            });
        }

        return res.status(200).json({
            message:
                "Fee structure deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Fee structure cannot be deleted because financial accounts already reference it.",
            });
        }

        console.error(
            "Failed to delete fee structure:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to delete fee structure.",
        });
    }
};
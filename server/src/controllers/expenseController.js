import pool from "../config/db.js";

// GET all expenses
export const getExpenses = async (req, res) => {
    const schoolId = req.schoolId;

    try {
        const result = await pool.query(
            `
            SELECT
                e.id,
                e.expense_category_id,
                e.expense_category_name,
                e.amount,
                e.expense_date::text AS expense_date,
                e.payment_method,
                e.reference,
                e.description,
                e.created_by,
                CONCAT_WS(' ', u.first_name, u.last_name) AS created_by_name,
                e.created_at,
                e.updated_at
            FROM expenses e
            JOIN users u
                ON u.id = e.created_by
            WHERE e.school_id = $1
            ORDER BY e.expense_date DESC, e.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get expenses error:", error);

        return res.status(500).json({
            message: "Failed to fetch expenses.",
        });
    }
};

// GET one expense
export const getExpenseById = async (req, res) => {
    const schoolId = req.schoolId;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT
                e.id,
                e.expense_category_id,
                e.expense_category_name,
                e.amount,
                e.expense_date::text AS expense_date,
                e.payment_method,
                e.reference,
                e.description,
                e.created_by,
                CONCAT_WS(' ', u.first_name, u.last_name) AS created_by_name,
                e.created_at,
                e.updated_at
            FROM expenses e
            JOIN users u
                ON u.id = e.created_by
            WHERE e.id = $1
              AND e.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found.",
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Get expense error:", error);

        return res.status(500).json({
            message: "Failed to fetch expense.",
        });
    }
};

// CREATE expense
export const createExpense = async (req, res) => {
    const schoolId = req.schoolId;
    const userId = req.user.userId;

    const {
        expenseCategoryId,
        amount,
        expenseDate,
        paymentMethod,
        reference,
        description,
    } = req.body;

    if (!expenseCategoryId) {
        return res.status(400).json({
            message: "Expense category is required.",
        });
    }

    if (
        amount === undefined ||
        amount === null ||
        amount === ""
    ) {
        return res.status(400).json({
            message: "Expense amount is required.",
        });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            message: "Expense amount must be greater than zero.",
        });
    }

    if (!expenseDate) {
        return res.status(400).json({
            message: "Expense date is required.",
        });
    }


    if (!paymentMethod) {
    return res.status(400).json({
        message: "Payment method is required.",
    });
}


    const validPaymentMethods = [
    "cash",
    "transfer",
    "pos",
    "cheque",
    "ussd",
    "other",
];

    if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
            message:
                "Invalid payment method. Allowed methods are cash, transfer, pos, cheque, ussd, and other.",
        });
    }


    if (!paymentMethod) {
        return res.status(400).json({
            message: "Payment method is required.",
        });
    }

    try {
        const categoryResult = await pool.query(
            `
            SELECT
                id,
                name,
                is_active
            FROM expense_categories
            WHERE id = $1
              AND school_id = $2;
            `,
            [expenseCategoryId, schoolId]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(404).json({
                message: "Expense category not found.",
            });
        }

        const category = categoryResult.rows[0];

        if (!category.is_active) {
            return res.status(400).json({
                message: "The selected expense category is inactive.",
            });
        }

        const userResult = await pool.query(
            `
            SELECT id
            FROM users
            WHERE id = $1
              AND school_id = $2
              AND status = 'active';
            `,
            [userId, schoolId]
        );

        if (userResult.rows.length === 0) {
            return res.status(403).json({
                message: "The current user is not an active user of this school.",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO expenses (
                school_id,
                expense_category_id,
                expense_category_name,
                amount,
                expense_date,
                payment_method,
                reference,
                description,
                created_by
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING
                id,
                expense_category_id,
                expense_category_name,
                amount,
                expense_date::text AS expense_date,
                payment_method,
                reference,
                description,
                created_by,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                expenseCategoryId,
                category.name,
                numericAmount,
                expenseDate,
                paymentMethod,
                reference?.trim() || null,
                description?.trim() || null,
                userId,
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Create expense error:", error);

        return res.status(500).json({
            message: "Failed to create expense.",
        });
    }
};

// UPDATE expense
export const updateExpense = async (req, res) => {
    const schoolId = req.schoolId;
    const { id } = req.params;

    const {
        expenseCategoryId,
        amount,
        expenseDate,
        paymentMethod,
        reference,
        description,
    } = req.body;

    try {
        const existingResult = await pool.query(
            `
            SELECT
                id,
                expense_category_id,
                amount,
                expense_date,
                payment_method,
                reference,
                description
            FROM expenses
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found.",
            });
        }

        const existingExpense = existingResult.rows[0];

        const updatedCategoryId =
            expenseCategoryId !== undefined
                ? expenseCategoryId
                : existingExpense.expense_category_id;

        const updatedAmount =
            amount !== undefined
                ? Number(amount)
                : Number(existingExpense.amount);

        const updatedExpenseDate =
            expenseDate !== undefined
                ? expenseDate
                : existingExpense.expense_date;

        const updatedPaymentMethod =
            paymentMethod !== undefined
                ? paymentMethod
                : existingExpense.payment_method;

        const updatedReference =
            reference !== undefined
                ? reference?.trim() || null
                : existingExpense.reference;

        const updatedDescription =
            description !== undefined
                ? description?.trim() || null
                : existingExpense.description;

        if (
            !Number.isFinite(updatedAmount) ||
            updatedAmount <= 0
        ) {
            return res.status(400).json({
                message: "Expense amount must be greater than zero.",
            });
        }

        if (!updatedExpenseDate) {
            return res.status(400).json({
                message: "Expense date is required.",
            });
        }

        if (!updatedPaymentMethod) {
            return res.status(400).json({
                message: "Payment method is required.",
            });
        }


        const validPaymentMethods = [
        "cash",
        "transfer",
        "pos",
        "cheque",
        "ussd",
        "other",
    ];

        if (!validPaymentMethods.includes(updatedPaymentMethod)) {
            return res.status(400).json({
                message:
                    "Invalid payment method. Allowed methods are cash, transfer, pos, cheque, ussd, and other.",
            });
        }

        const categoryResult = await pool.query(
            `
            SELECT
                id,
                name,
                is_active
            FROM expense_categories
            WHERE id = $1
              AND school_id = $2;
            `,
            [updatedCategoryId, schoolId]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(404).json({
                message: "Expense category not found.",
            });
        }

        const category = categoryResult.rows[0];

        if (!category.is_active) {
            return res.status(400).json({
                message: "The selected expense category is inactive.",
            });
        }

        const result = await pool.query(
            `
            UPDATE expenses
            SET
                expense_category_id = $1,
                expense_category_name = $2,
                amount = $3,
                expense_date = $4,
                payment_method = $5,
                reference = $6,
                description = $7,
                updated_at = NOW()
            WHERE id = $8
              AND school_id = $9
            RETURNING
                id,
                expense_category_id,
                expense_category_name,
                amount,
                expense_date::text AS expense_date,
                payment_method,
                reference,
                description,
                created_by,
                created_at,
                updated_at;
            `,
            [
                updatedCategoryId,
                category.name,
                updatedAmount,
                updatedExpenseDate,
                updatedPaymentMethod,
                updatedReference,
                updatedDescription,
                id,
                schoolId,
            ]
        );

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Update expense error:", error);

        return res.status(500).json({
            message: "Failed to update expense.",
        });
    }
};
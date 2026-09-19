import pool from "../config/db.js";

export const getPayments = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                p.id,
                p.school_id,
                p.student_id,
                p.financial_account_id,
                p.amount,
                p.payment_date,
                p.payment_method,
                p.reference,
                p.description,
                p.created_at,
                p.updated_at,

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                a.name AS academic_session_name,

                t.name AS term_name,

                c.name AS class_name,

                se.id AS enrollment_id

            FROM payments p

            JOIN students s
                ON s.id = p.student_id

            JOIN student_financial_accounts sfa
                ON sfa.id = p.financial_account_id

            JOIN academic_sessions a
                ON a.id = sfa.academic_session_id

            JOIN terms t
                ON t.id = sfa.term_id

            JOIN student_enrollments se
                ON se.id = sfa.enrollment_id

            JOIN classes c
                ON c.id = se.class_id

            WHERE p.school_id = $1

            ORDER BY
                p.payment_date DESC,
                p.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            payments: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch payments:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch payments.",
        });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                p.id,
                p.school_id,
                p.student_id,
                p.financial_account_id,
                p.amount,
                p.payment_date,
                p.payment_method,
                p.reference,
                p.description,
                p.created_at,
                p.updated_at,

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                a.name AS academic_session_name,

                t.name AS term_name,

                c.name AS class_name,

                se.id AS enrollment_id

            FROM payments p

            JOIN students s
                ON s.id = p.student_id

            JOIN student_financial_accounts sfa
                ON sfa.id = p.financial_account_id

            JOIN academic_sessions a
                ON a.id = sfa.academic_session_id

            JOIN terms t
                ON t.id = sfa.term_id

            JOIN student_enrollments se
                ON se.id = sfa.enrollment_id

            JOIN classes c
                ON c.id = se.class_id

            WHERE p.id = $1
              AND p.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Payment not found.",
            });
        }

        return res.status(200).json({
            payment: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch payment:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch payment.",
        });
    }
};




export const createPayment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            studentId,
            financialAccountId,
            amount,
            paymentDate,
            paymentMethod,
            reference,
            description,
        } = req.body;

        if (
            !studentId ||
            !financialAccountId ||
            !amount ||
            !paymentDate ||
            !paymentMethod
        ) {
            return res.status(400).json({
                message:
                    "Student, financial account, amount, payment date, and payment method are required.",
            });
        }

        const parsedAmount = Number(amount);

        if (
            !Number.isFinite(parsedAmount) ||
            parsedAmount <= 0
        ) {
            return res.status(400).json({
                message:
                    "Payment amount must be greater than zero.",
            });
        }

        const accountResult = await client.query(
            `
            SELECT
                sfa.id,
                sfa.school_id,
                sfa.student_id,
                sfa.total_due,
                sfa.total_paid,
                sfa.status
            FROM student_financial_accounts sfa
            WHERE sfa.id = $1
              AND sfa.school_id = $2
              AND sfa.student_id = $3
            FOR UPDATE;
            `,
            [
                financialAccountId,
                schoolId,
                studentId,
            ]
        );

        if (accountResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Financial account not found for the selected student.",
            });
        }

        const account = accountResult.rows[0];

        const totalDue = Number(account.total_due);
        const totalPaid = Number(account.total_paid);

        const outstandingBalance =
            totalDue - totalPaid;

        if (parsedAmount > outstandingBalance) {
            return res.status(400).json({
                message:
                    "Payment amount cannot exceed the outstanding balance.",
            });
        }

        await client.query("BEGIN");

        const paymentResult = await client.query(
            `
            INSERT INTO payments (
                school_id,
                student_id,
                financial_account_id,
                amount,
                payment_date,
                payment_method,
                reference,
                description
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
            )
            RETURNING
                id,
                school_id,
                student_id,
                financial_account_id,
                amount,
                payment_date,
                payment_method,
                reference,
                description,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                studentId,
                financialAccountId,
                parsedAmount,
                paymentDate,
                paymentMethod,
                reference || null,
                description || null,
            ]
        );

        const newTotalPaid =
            totalPaid + parsedAmount;

        let newStatus = "partially_paid";

        if (newTotalPaid === totalDue) {
            newStatus = "paid";
        }

        if (newTotalPaid === 0) {
            newStatus = "unpaid";
        }

        await client.query(
            `
            UPDATE student_financial_accounts
            SET
                total_paid = $1,
                status = $2,
                updated_at = NOW()
            WHERE id = $3
              AND school_id = $4;
            `,
            [
                newTotalPaid,
                newStatus,
                financialAccountId,
                schoolId,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Payment recorded successfully.",
            payment: paymentResult.rows[0],
            financialAccount: {
                id: financialAccountId,
                totalDue,
                totalPaid: newTotalPaid,
                outstandingBalance:
                    totalDue - newTotalPaid,
                status: newStatus,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23503") {
            return res.status(400).json({
                message:
                    "The selected payment references an invalid record.",
            });
        }

        console.error(
            "Failed to create payment:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create payment.",
        });
    } finally {
        client.release();
    }
};
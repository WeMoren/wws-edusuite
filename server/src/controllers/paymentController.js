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

    let transactionStarted = false;

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
            const parsedAmountInKobo = Math.round(parsedAmount * 100);

            const allowedPaymentMethods = [
                "cash",
                "transfer",
                "pos",
                "cheque",
                "ussd",
                "other",
            ];

            const validAmount =
                Number.isFinite(parsedAmount) &&
                parsedAmount > 0 &&
                Number.isSafeInteger(parsedAmountInKobo) &&
                Math.abs(parsedAmount * 100 - parsedAmountInKobo) < 1e-7;

            const validDate =
                typeof paymentDate === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(paymentDate) &&
                !Number.isNaN(Date.parse(`${paymentDate}T00:00:00Z`)) &&
                new Date(`${paymentDate}T00:00:00Z`)
                    .toISOString()
                    .startsWith(paymentDate);

            const validMethod =
                typeof paymentMethod === "string" &&
                allowedPaymentMethods.includes(paymentMethod);

            if (!validAmount || !validDate || !validMethod) {
                return res.status(400).json({
                    message:
                        "A valid amount (maximum two decimal places), payment date, and payment method are required.",
                });
            }

        await client.query("BEGIN");
        transactionStarted = true;

        const accountResult = await client.query(
            `
            SELECT
                sfa.id,
                sfa.school_id,
                sfa.student_id,
                sfa.enrollment_id,
                sfa.academic_session_id,
                sfa.term_id,
                sfa.fee_structure_id,
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
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                message:
                    "Financial account not found for the selected student.",
            });
        }

        const account = accountResult.rows[0];

        const totalDueInKobo = Math.round(
            Number(account.total_due) * 100
        );

        const totalPaidInKobo = Math.round(
            Number(account.total_paid) * 100
        );

        const outstandingBalanceInKobo =
            totalDueInKobo - totalPaidInKobo;

        if (
            totalPaidInKobo > totalDueInKobo ||
            parsedAmountInKobo > outstandingBalanceInKobo
        ) {
                await client.query("ROLLBACK");
             transactionStarted = false;

            return res.status(400).json({
                message:
                    "Payment amount cannot exceed the outstanding balance.",
            });
        }

        const totalDue = totalDueInKobo / 100;

        const paymentAmount = parsedAmountInKobo / 100;

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
                payment_date::text AS payment_date,
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
                paymentAmount,
                paymentDate,
                paymentMethod,
                reference || null,
                description || null,
            ]
        );

        const payment = paymentResult.rows[0];

        const newTotalPaidInKobo =  totalPaidInKobo + parsedAmountInKobo;

        const newTotalPaid = newTotalPaidInKobo / 100;

        const remainingBalanceInKobo =
            totalDueInKobo - newTotalPaidInKobo;

        const remainingBalance =
            remainingBalanceInKobo / 100;

        let newStatus = "partially_paid";

        if (newTotalPaidInKobo === totalDueInKobo) {
            newStatus = "paid";
        }

        if (newTotalPaidInKobo === 0) {
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

        const receiptContextResult = await client.query(
            `
            SELECT
                sc.name AS school_name,
                sc.email AS school_email,
                sc.phone AS school_phone,
                sc.address AS school_address,
                sc.logo_url AS school_logo_url,

                s.admission_no,
                CONCAT_WS(
                    ' ',
                    s.first_name,
                    s.middle_name,
                    s.last_name
                ) AS student_name,
                s.gender,

                a.name AS academic_session_name,
                t.name AS term_name,
                al.id AS academic_level_id,
                al.name AS academic_level_name,
                c.id AS class_id,
                c.name AS class_name,

                principal.name AS principal_name,
                principal.title AS principal_title,
                principal.signature_url AS principal_signature_url,
                principal.stamp_url AS principal_stamp_url,

                accounting.name AS accounting_officer_name,
                accounting.title AS accounting_officer_title,
                accounting.signature_url AS accounting_officer_signature_url,
                accounting.stamp_url AS accounting_officer_stamp_url

            FROM schools sc

            JOIN students s
                ON s.id = $1

            JOIN academic_sessions a
                ON a.id = $2

            JOIN terms t
                ON t.id = $3

            JOIN student_enrollments se
                ON se.id = $4

            JOIN classes c
                ON c.id = se.class_id

            JOIN academic_levels al
                ON al.id = c.academic_level_id

            LEFT JOIN school_officials principal
                ON principal.school_id = sc.id
               AND principal.official_type = 'principal'

            LEFT JOIN school_officials accounting
                ON accounting.school_id = sc.id
               AND accounting.official_type = 'accounting_officer'

            WHERE sc.id = $5;
            `,
            [
                studentId,
                account.academic_session_id,
                account.term_id,
                account.enrollment_id,
                schoolId,
            ]
        );

        if (receiptContextResult.rows.length === 0) {
            throw new Error(
                "Unable to build payment receipt context."
            );
        }

        const receiptContext =
            receiptContextResult.rows[0];

        const receiptNumberResult = await client.query(
            `
            SELECT nextval(
                'payment_receipt_number_seq'
            ) AS receipt_number;
            `
        );

        const receiptNumber = Number(
            receiptNumberResult.rows[0].receipt_number
        );

        const receiptResult = await client.query(
            `
            INSERT INTO payment_receipts (
                school_id,
                payment_id,
                receipt_number,

                school_name,
                school_email,
                school_phone,
                school_address,
                school_logo_url,

                student_id,
                student_name,
                admission_number,
                gender,

                academic_session_id,
                academic_session_name,
                term_id,
                term_name,
                academic_level_id,
                academic_level_name,
                class_id,
                class_name,

                financial_account_id,

                total_due,
                amount_paid,
                total_paid_after_payment,
                outstanding_balance_after_payment,

                payment_date,
                payment_method,
                payment_reference,
                payment_description,

                principal_name,
                principal_title,
                principal_signature_url,
                principal_stamp_url,

                accounting_officer_name,
                accounting_officer_title,
                accounting_officer_signature_url,
                accounting_officer_stamp_url
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

                $9,
                $10,
                $11,
                $12,

                $13,
                $14,
                $15,
                $16,
                $17,
                $18,
                $19,
                $20,

                $21,

                $22,
                $23,
                $24,
                $25,

                $26,
                $27,
                $28,
                $29,

                $30,
                $31,
                $32,
                $33,

                $34,
                $35,
                $36,
                $37
            )
            RETURNING
                id,
                receipt_number;
            `,
            [
                schoolId,
                payment.id,
                receiptNumber,

                receiptContext.school_name,
                receiptContext.school_email,
                receiptContext.school_phone,
                receiptContext.school_address,
                receiptContext.school_logo_url,

                studentId,
                receiptContext.student_name,
                receiptContext.admission_no,
                receiptContext.gender,

                account.academic_session_id,
                receiptContext.academic_session_name,
                account.term_id,
                receiptContext.term_name,
                receiptContext.academic_level_id,
                receiptContext.academic_level_name,
                receiptContext.class_id,
                receiptContext.class_name,

                financialAccountId,

                totalDue,
                paymentAmount,
                newTotalPaid,
                remainingBalance,

                payment.payment_date,
                payment.payment_method,
                payment.reference,
                payment.description,

                receiptContext.principal_name,
                receiptContext.principal_title,
                receiptContext.principal_signature_url,
                receiptContext.principal_stamp_url,

                receiptContext.accounting_officer_name,
                receiptContext.accounting_officer_title,
                receiptContext.accounting_officer_signature_url,
                receiptContext.accounting_officer_stamp_url,
            ]
        );

        const receipt = receiptResult.rows[0];

        await client.query(
            `
            INSERT INTO payment_receipt_items (
                payment_receipt_id,
                name,
                amount,
                display_order
            )
            SELECT
                $1,
                name,
                amount,
                display_order
            FROM fee_structure_items
            WHERE fee_structure_id = $2
            ORDER BY display_order ASC;
            `,
            [
                receipt.id,
                account.fee_structure_id,
            ]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            message: "Payment recorded successfully.",
            payment,
            financialAccount: {
                id: financialAccountId,
                totalDue,
                totalPaid: newTotalPaid,
                outstandingBalance: remainingBalance,
                status: newStatus,
            },
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receipt_number,
            },
        });
    } catch (error) {
        if (transactionStarted) {
                try {
                    await client.query("ROLLBACK");
                } catch (rollbackError) {
                    console.error(
                        "Failed to roll back payment transaction:",
                        rollbackError.message
                    );
                }
            }

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
export const updatePayment = async (req, res) => {
    const client = await pool.connect();

    let transactionStarted = false;

    try {
        const { schoolId } = req;
        const { userId } = req.user;
        const { id } = req.params;

        const {
            amount,
            paymentDate,
            paymentMethod,
            reference,
            description,
            reason,
        } = req.body;

        const parsedAmount = Number(amount);
            const parsedAmountInKobo = Math.round(parsedAmount * 100);

            const allowedPaymentMethods = [
                "cash",
                "transfer",
                "pos",
                "cheque",
                "ussd",
                "other",
            ];

            const validAmount =
                Number.isFinite(parsedAmount) &&
                parsedAmount > 0 &&
                Number.isSafeInteger(parsedAmountInKobo) &&
                Math.abs(parsedAmount * 100 - parsedAmountInKobo) < 1e-7;

            const validDate =
                typeof paymentDate === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(paymentDate) &&
                !Number.isNaN(Date.parse(`${paymentDate}T00:00:00Z`)) &&
                new Date(`${paymentDate}T00:00:00Z`)
                    .toISOString()
                    .startsWith(paymentDate);

            const validMethod =
                typeof paymentMethod === "string" &&
                allowedPaymentMethods.includes(paymentMethod);

            const validReason =
                typeof reason === "string" &&
                reason.trim().length > 0;

            if (
                !validAmount ||
                !validDate ||
                !validMethod ||
                !validReason
            ) {
                return res.status(400).json({
                    message:
                        "A valid amount (maximum two decimal places), payment date, payment method, and correction reason are required.",
                });
            }

        await client.query("BEGIN");
        transactionStarted = true;

        // Lock the payment being corrected.
        const paymentResult = await client.query(
            `
            SELECT
                id,
                school_id,
                student_id,
                financial_account_id,
                amount,
                payment_date,
                payment_method,
                reference,
                description
            FROM payments
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (paymentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                message: "Payment not found.",
            });
        }

        const oldPayment = paymentResult.rows[0];

        // Lock the associated financial account.
        const accountResult = await client.query(
            `
            SELECT
                id,
                total_due,
                total_paid,
                fee_structure_id
            FROM student_financial_accounts
            WHERE id = $1
              AND school_id = $2
              AND student_id = $3
            FOR UPDATE;
            `,
            [
                oldPayment.financial_account_id,
                schoolId,
                oldPayment.student_id,
            ]
        );

        if (accountResult.rows.length === 0) {
            throw new Error(
                "The payment's financial account could not be found."
            );
        }

        const account = accountResult.rows[0];

        // Retrieve and lock the currently valid receipt.
        const receiptResult = await client.query(
            `
            SELECT id
            FROM payment_receipts
            WHERE payment_id = $1
              AND school_id = $2
              AND status = 'current'
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (receiptResult.rows.length === 0) {
            throw new Error(
                "The current payment receipt could not be found."
            );
        }

        const oldReceiptId = receiptResult.rows[0].id;

        const totalDueInKobo = Math.round(
            Number(account.total_due) * 100
        );

        const totalPaidInKobo = Math.round(
            Number(account.total_paid) * 100
        );

        const oldAmountInKobo = Math.round(
            Number(oldPayment.amount) * 100
        );

        const newTotalPaidInKobo =
            totalPaidInKobo -
            oldAmountInKobo +
            parsedAmountInKobo;

        if (newTotalPaidInKobo < 0) {
            throw new Error(
                "The resulting account balance is invalid."
            );
        }

        if (newTotalPaidInKobo > totalDueInKobo) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message:
                    "The corrected payment would exceed the financial account's total due.",
            });
        }

        const newTotalPaid = newTotalPaidInKobo / 100;
        const outstandingBalance =
            (totalDueInKobo - newTotalPaidInKobo) / 100;

        let newStatus = "unpaid";

        if (newTotalPaidInKobo > 0) {
            newStatus =
                newTotalPaidInKobo === totalDueInKobo
                    ? "paid"
                    : "partially_paid";
        }

        // Save the corrected payment.
        const updatedPaymentResult = await client.query(
            `
            UPDATE payments
            SET
                amount = $1,
                payment_date = $2,
                payment_method = $3,
                reference = $4,
                description = $5,
                updated_at = NOW()
            WHERE id = $6
              AND school_id = $7
            RETURNING
                id,
                school_id,
                student_id,
                financial_account_id,
                amount,
                payment_date::text AS payment_date,
                payment_method,
                reference,
                description,
                created_at,
                updated_at;
            `,
            [
                parsedAmountInKobo / 100,
                paymentDate,
                paymentMethod,
                reference || null,
                description || null,
                id,
                schoolId,
            ]
        );

        const payment = updatedPaymentResult.rows[0];

        // Recalculate the financial account.
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
                account.id,
                schoolId,
            ]
        );

        const oldValues = {
            amount: Number(oldPayment.amount),
            paymentDate: oldPayment.payment_date,
            paymentMethod: oldPayment.payment_method,
            reference: oldPayment.reference,
            description: oldPayment.description,
        };

        const newValues = {
            amount: Number(payment.amount),
            paymentDate: payment.payment_date,
            paymentMethod: payment.payment_method,
            reference: payment.reference,
            description: payment.description,
        };

        // Record the correction before issuing the new receipt.
        await client.query(
            `
            INSERT INTO payment_corrections (
                school_id,
                payment_id,
                corrected_by,
                correction_reason,
                old_values,
                new_values
            )
            VALUES ($1, $2, $3, $4, $5, $6);
            `,
            [
                schoolId,
                id,
                userId,
                reason.trim(),
                oldValues,
                newValues,
            ]
        );

        // Preserve the original receipt as a historical record.
        await client.query(
            `
            UPDATE payment_receipts
            SET
                status = 'superseded',
                superseded_at = NOW(),
                superseded_by = $1,
                superseded_reason = $2
            WHERE id = $3
              AND school_id = $4;
            `,
            [
                userId,
                reason.trim(),
                oldReceiptId,
                schoolId,
            ]
        );

        const receiptNumberResult = await client.query(
            `
            SELECT nextval(
                'payment_receipt_number_seq'
            ) AS receipt_number;
            `
        );

        const receiptNumber = Number(
            receiptNumberResult.rows[0].receipt_number
        );

        // Generate a new receipt from the original snapshot.
        const newReceiptResult = await client.query(
            `
            INSERT INTO payment_receipts (
                school_id,
                payment_id,
                receipt_number,

                school_name,
                school_email,
                school_phone,
                school_address,
                school_logo_url,

                student_id,
                student_name,
                admission_number,
                gender,

                academic_session_id,
                academic_session_name,
                term_id,
                term_name,
                academic_level_id,
                academic_level_name,
                class_id,
                class_name,

                financial_account_id,

                total_due,
                amount_paid,
                total_paid_after_payment,
                outstanding_balance_after_payment,

                payment_date,
                payment_method,
                payment_reference,
                payment_description,

                principal_name,
                principal_title,
                principal_signature_url,
                principal_stamp_url,

                accounting_officer_name,
                accounting_officer_title,
                accounting_officer_signature_url,
                accounting_officer_stamp_url
            )
            SELECT
                school_id,
                payment_id,
                $2,

                school_name,
                school_email,
                school_phone,
                school_address,
                school_logo_url,

                student_id,
                student_name,
                admission_number,
                gender,

                academic_session_id,
                academic_session_name,
                term_id,
                term_name,
                academic_level_id,
                academic_level_name,
                class_id,
                class_name,

                financial_account_id,

                total_due,
                $3,
                $4,
                $5,

                $6,
                $7,
                $8,
                $9,

                principal_name,
                principal_title,
                principal_signature_url,
                principal_stamp_url,

                accounting_officer_name,
                accounting_officer_title,
                accounting_officer_signature_url,
                accounting_officer_stamp_url

            FROM payment_receipts
            WHERE id = $1
            RETURNING id, receipt_number;
            `,
            [
                oldReceiptId,
                receiptNumber,
                parsedAmountInKobo / 100,
                newTotalPaid,
                outstandingBalance,
                payment.payment_date,
                payment.payment_method,
                payment.reference,
                payment.description,
            ]
        );

        if (newReceiptResult.rows.length === 0) {
            throw new Error(
                "Failed to generate the corrected receipt."
            );
        }

        const newReceipt = newReceiptResult.rows[0];

        // Carry forward the original fee-item snapshot.
        await client.query(
            `
            INSERT INTO payment_receipt_items (
                payment_receipt_id,
                name,
                amount,
                display_order
            )
            SELECT
                $1,
                name,
                amount,
                display_order
            FROM payment_receipt_items
            WHERE payment_receipt_id = $2
            ORDER BY display_order ASC;
            `,
            [newReceipt.id, oldReceiptId]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(200).json({
            message: "Payment corrected successfully.",
            payment,
            financialAccount: {
                id: account.id,
                totalDue: totalDueInKobo / 100,
                totalPaid: newTotalPaid,
                outstandingBalance,
                status: newStatus,
            },
            receipt: {
                id: newReceipt.id,
                receiptNumber: newReceipt.receipt_number,
            },
        });
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Failed to roll back payment correction:",
                    rollbackError.message
                );
            }
        }

        console.error(
            "Failed to correct payment:",
            error.message
        );

        if (error.code === "23503") {
            return res.status(400).json({
                message:
                    "The correction references an invalid record.",
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                message:
                    "The corrected payment contains invalid values.",
            });
        }

        return res.status(500).json({
            message: "Failed to correct payment.",
        });
    } finally {
        client.release();
    }
};

export const getPaymentCorrectionHistory = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        // Confirm that the payment belongs to this school.
        const paymentResult = await pool.query(
            `
            SELECT id
            FROM payments
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Payment not found.",
            });
        }

        const result = await pool.query(
            `
            SELECT
                pc.id,
                pc.payment_id,
                pc.correction_reason,
                pc.old_values,
                pc.new_values,
                pc.created_at,

                u.id AS corrected_by_id,
                u.first_name AS corrected_by_first_name,
                u.last_name AS corrected_by_last_name

            FROM payment_corrections pc

            JOIN users u
                ON u.id = pc.corrected_by
               AND u.school_id = pc.school_id

            WHERE pc.payment_id = $1
              AND pc.school_id = $2

            ORDER BY pc.created_at DESC;
            `,
            [id, schoolId]
        );

        return res.status(200).json({
            paymentId: id,
            corrections: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch payment correction history:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch payment correction history.",
        });
    }
};

import pool from "../config/db.js";

export const getPaymentReceipt = async (req, res) => {
    try {
        const { schoolId } = req;
        const { paymentId } = req.params;

        const receiptResult = await pool.query(
            `
            SELECT
                pr.id,
                pr.school_id,
                pr.payment_id,
                pr.receipt_number,

                pr.school_name,
                pr.school_email,
                pr.school_phone,
                pr.school_address,
                pr.school_logo_url,

                pr.student_id,
                pr.student_name,
                pr.admission_number,
                pr.gender,

                pr.academic_session_id,
                pr.academic_session_name,
                pr.term_id,
                pr.term_name,
                pr.academic_level_id,
                pr.academic_level_name,
                pr.class_id,
                pr.class_name,

                pr.financial_account_id,

                pr.total_due,
                pr.amount_paid,
                pr.total_paid_after_payment,
                pr.outstanding_balance_after_payment,

                pr.payment_date::text AS payment_date,
                pr.payment_method,
                pr.payment_reference,
                pr.payment_description,

                pr.principal_name,
                pr.principal_title,
                pr.principal_signature_url,
                pr.principal_stamp_url,

                pr.accounting_officer_name,
                pr.accounting_officer_title,
                pr.accounting_officer_signature_url,
                pr.accounting_officer_stamp_url,

                pr.created_at

            FROM payment_receipts pr

            WHERE pr.payment_id = $1
              AND pr.school_id = $2;
            `,
            [paymentId, schoolId]
        );

        if (receiptResult.rows.length === 0) {
            return res.status(404).json({
                message: "Payment receipt not found.",
            });
        }

        const receipt = receiptResult.rows[0];

        const feeItemsResult = await pool.query(
            `
            SELECT
                id,
                name,
                amount,
                display_order
            FROM payment_receipt_items
            WHERE payment_receipt_id = $1
            ORDER BY display_order ASC;
            `,
            [receipt.id]
        );

        const totalDue = Number(receipt.total_due);
        const amountPaid = Number(receipt.amount_paid);
        const totalPaidAfterPayment =
            Number(receipt.total_paid_after_payment);
        const outstandingBalance =
            Number(receipt.outstanding_balance_after_payment);

        return res.status(200).json({
            receipt: {
                id: receipt.id,
                paymentId: receipt.payment_id,
                receiptNumber: receipt.receipt_number,

                school: {
                    id: receipt.school_id,
                    name: receipt.school_name,
                    email: receipt.school_email,
                    phone: receipt.school_phone,
                    address: receipt.school_address,
                    logoUrl: receipt.school_logo_url,
                },

                student: {
                    id: receipt.student_id,
                    name: receipt.student_name,
                    admissionNo:
                        receipt.admission_number,
                    gender: receipt.gender,
                },

                academic: {
                    sessionId:
                        receipt.academic_session_id,
                    sessionName:
                        receipt.academic_session_name,

                    termId: receipt.term_id,
                    termName: receipt.term_name,

                    academicLevelId:
                        receipt.academic_level_id,
                    academicLevel:
                        receipt.academic_level_name,

                    classId: receipt.class_id,
                    className: receipt.class_name,
                },

                financialAccountId:
                    receipt.financial_account_id,

                payment: {
                    amount: amountPaid,
                    paymentDate: receipt.payment_date,
                    paymentMethod:
                        receipt.payment_method,
                    reference:
                        receipt.payment_reference,
                    description:
                        receipt.payment_description,
                },

                fees: {
                    items: feeItemsResult.rows,
                    totalDue,
                    amountPaid,
                    totalPaidAfterPayment,
                    outstandingBalance,
                },

                authorization: {
                    principal: {
                        name: receipt.principal_name,
                        title: receipt.principal_title,
                        signatureUrl:
                            receipt.principal_signature_url,
                        stampUrl:
                            receipt.principal_stamp_url,
                    },

                    accountingOfficer: {
                        name:
                            receipt.accounting_officer_name,
                        title:
                            receipt.accounting_officer_title,
                        signatureUrl:
                            receipt.accounting_officer_signature_url,
                        stampUrl:
                            receipt.accounting_officer_stamp_url,
                    },
                },

                createdAt: receipt.created_at,
            },
        });
    } catch (error) {
        console.error(
            "Failed to fetch payment receipt:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to fetch payment receipt.",
        });
    }
};
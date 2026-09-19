import pool from "../config/db.js";

export const getPaymentReceipt = async (req, res) => {
    try {
        const { schoolId } = req;
        const { paymentId } = req.params;

        const paymentResult = await pool.query(
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

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,
                s.gender,

                sc.name AS school_name,
                sc.phone AS school_phone,
                sc.address AS school_address,
                sc.logo_url AS school_logo_url,

                sfa.academic_session_id,
                sfa.term_id,
                sfa.fee_structure_id,
                sfa.total_due,
                sfa.total_paid,

                a.name AS academic_session_name,

                t.name AS term_name,

                c.name AS class_name,

                al.name AS academic_level_name

            FROM payments p

            JOIN students s
                ON s.id = p.student_id

            JOIN schools sc
                ON sc.id = p.school_id

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

            JOIN academic_levels al
                ON al.id = c.academic_level_id

            WHERE p.id = $1
              AND p.school_id = $2;
            `,
            [paymentId, schoolId]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Payment receipt data not found.",
            });
        }

        const payment = paymentResult.rows[0];

        const feeItemsResult = await pool.query(
            `
            SELECT
                id,
                name,
                amount,
                display_order
            FROM fee_structure_items
            WHERE fee_structure_id = $1
            ORDER BY display_order ASC;
            `,
            [payment.fee_structure_id]
        );

        const totalDue = Number(payment.total_due);
        const totalPaid = Number(payment.total_paid);
        const paymentAmount = Number(payment.amount);

        const outstandingBalance =
            totalDue - totalPaid;

        return res.status(200).json({
            receipt: {
                paymentId: payment.id,

                school: {
                    id: payment.school_id,
                    name: payment.school_name,
                    phone: payment.school_phone,
                    address: payment.school_address,
                    logoUrl: payment.school_logo_url,
                },

                student: {
                    id: payment.student_id,
                    admissionNo: payment.admission_no,
                    firstName: payment.first_name,
                    middleName: payment.middle_name,
                    lastName: payment.last_name,
                    gender: payment.gender,
                },

                academic: {
                    sessionId:
                        payment.academic_session_id,
                    sessionName:
                        payment.academic_session_name,
                    termId: payment.term_id,
                    termName: payment.term_name,
                    academicLevel:
                        payment.academic_level_name,
                    className: payment.class_name,
                },

                payment: {
                    amount: paymentAmount,
                    paymentDate: payment.payment_date,
                    paymentMethod:
                        payment.payment_method,
                    reference: payment.reference,
                    description: payment.description,
                },

                fees: {
                    items: feeItemsResult.rows,
                    totalDue,
                    totalPaid,
                    outstandingBalance,
                },
            },
        });
    } catch (error) {
        console.error(
            "Failed to fetch payment receipt data:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to fetch payment receipt data.",
        });
    }
};
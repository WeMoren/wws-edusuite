import pool from "../config/db.js";
import {
    createStudentFinancialAccountForTerm,
} from "../services/studentFinancialAccountService.js";

export const createStudentFinancialAccount = async (
    req,
    res
) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const { schoolId } = req;

        const {
            studentId,
            enrollmentId,
            termId,
        } = req.body;

        if (
            !studentId ||
            !enrollmentId ||
            !termId
        ) {
            return res.status(400).json({
                message:
                    "Student, enrollment, and term are required.",
            });
        }

        const studentResult = await client.query(
            `
            SELECT id
            FROM students
            WHERE id = $1
              AND school_id = $2;
            `,
            [studentId, schoolId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        await client.query("BEGIN");
        transactionStarted = true;

        const accountResult =
            await createStudentFinancialAccountForTerm(
                client,
                {
                    schoolId,
                    studentId,
                    enrollmentId,
                    termId,
                }
            );

        if (accountResult.skipped) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message:
                    accountResult.reason ||
                    "A financial account cannot be created for this enrollment.",
            });
        }

        if (!accountResult.created) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                message:
                    "A financial account already exists for this student, enrollment, and term.",
            });
        }

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            message:
                "Student financial account created successfully.",
            financialAccount:
                accountResult.financialAccount,
        });
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
                transactionStarted = false;
            } catch (rollbackError) {
                console.error(
                    "Failed to roll back financial account transaction:",
                    rollbackError.message
                );
            }
        }

        if (
            error.message ===
                "Enrollment not found for the selected student and school." ||
            error.message ===
                "Term not found for the student's academic session." ||
            error.message ===
                "No active fee structure exists for the student's academic level and selected term."
        ) {
            return res.status(404).json({
                message: error.message,
            });
        }

        if (
            error.message.includes(
                "Multiple active fee structures exist"
            )
        ) {
            return res.status(409).json({
                message: error.message,
            });
        }

        if (
            error.message.includes(
                "has no fee items"
            )
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        console.error(
            "Failed to create student financial account:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to create student financial account.",
        });
    } finally {
        client.release();
    }
};

export const getStudentFinancialAccountById = async (
    req,
    res
) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
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
                sfa.status,
                sfa.created_at,
                sfa.updated_at,

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                a.name AS academic_session_name,

                t.name AS term_name,

                fs.name AS fee_structure_name,

                c.name AS class_name,

                al.name AS academic_level_name

            FROM student_financial_accounts sfa

            JOIN students s
                ON s.id = sfa.student_id

            JOIN academic_sessions a
                ON a.id = sfa.academic_session_id

            JOIN terms t
                ON t.id = sfa.term_id

            JOIN fee_structures fs
                ON fs.id = sfa.fee_structure_id

            JOIN student_enrollments se
                ON se.id = sfa.enrollment_id

            JOIN classes c
                ON c.id = se.class_id

            JOIN academic_levels al
                ON al.id = c.academic_level_id

            WHERE sfa.id = $1
              AND sfa.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Student financial account not found.",
            });
        }

        return res.status(200).json({
            financialAccount: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch student financial account:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to fetch student financial account.",
        });
    }
};

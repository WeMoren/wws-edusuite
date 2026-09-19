import pool from "../config/db.js";

export const getStudentFinancialAccounts = async (req, res) => {
    try {
        const { schoolId } = req;

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

            WHERE sfa.school_id = $1

            ORDER BY
                sfa.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            financialAccounts: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch student financial accounts:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to fetch student financial accounts.",
        });
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

export const createStudentFinancialAccount = async (
    req,
    res
) => {
    const client = await pool.connect();

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

        /*
         * Validate student belongs to this school.
         */
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

        /*
         * Validate enrollment belongs to this
         * school and selected student.
         */
        const enrollmentResult =
            await client.query(
                `
                SELECT
                    se.id,
                    se.student_id,
                    se.academic_session_id,
                    se.class_id,
                    c.academic_level_id
                FROM student_enrollments se

                JOIN classes c
                    ON c.id = se.class_id

                WHERE se.id = $1
                  AND se.school_id = $2
                  AND se.student_id = $3;
                `,
                [
                    enrollmentId,
                    schoolId,
                    studentId,
                ]
            );

        if (enrollmentResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Enrollment not found for the selected student.",
            });
        }

        const enrollment =
            enrollmentResult.rows[0];

        /*
         * Validate term belongs to this school
         * and the enrollment's academic session.
         */
        const termResult = await client.query(
            `
            SELECT
                id,
                academic_session_id,
                name,
                is_current
            FROM terms
            WHERE id = $1
              AND school_id = $2
              AND academic_session_id = $3;
            `,
            [
                termId,
                schoolId,
                enrollment.academic_session_id,
            ]
        );

        if (termResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Term not found for the student's academic session.",
            });
        }

        /*
         * Find the current fee structure for
         * the student's academic level,
         * academic session, and selected term.
         */
        const feeStructureResult =
            await client.query(
                `
                SELECT
                    fs.id,
                    fs.name
                FROM fee_structures fs
                WHERE fs.school_id = $1
                  AND fs.academic_session_id = $2
                  AND fs.term_id = $3
                  AND fs.academic_level_id = $4
                  AND fs.is_current = TRUE
                ORDER BY fs.created_at DESC
                LIMIT 1;
                `,
                [
                    schoolId,
                    enrollment.academic_session_id,
                    termId,
                    enrollment.academic_level_id,
                ]
            );

        if (feeStructureResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "No current fee structure exists for the student's academic level and selected term.",
            });
        }

        const feeStructure =
            feeStructureResult.rows[0];

        /*
         * Calculate the total directly from
         * the fee structure items.
         */
        const totalResult = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total_due
            FROM fee_structure_items
            WHERE fee_structure_id = $1;
            `,
            [feeStructure.id]
        );

        const totalDue =
            totalResult.rows[0].total_due;

        /*
         * Prevent duplicate financial accounts
         * for the same student, enrollment, and term.
         */
        const existingResult =
            await client.query(
                `
                SELECT id
                FROM student_financial_accounts
                WHERE student_id = $1
                  AND enrollment_id = $2
                  AND term_id = $3;
                `,
                [
                    studentId,
                    enrollmentId,
                    termId,
                ]
            );

        if (existingResult.rows.length > 0) {
            return res.status(409).json({
                message:
                    "A financial account already exists for this student, enrollment, and term.",
            });
        }

        await client.query("BEGIN");

        const result = await client.query(
            `
            INSERT INTO student_financial_accounts (
                school_id,
                student_id,
                enrollment_id,
                academic_session_id,
                term_id,
                fee_structure_id,
                total_due,
                total_paid,
                status
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                0,
                'unpaid'
            )
            RETURNING
                id,
                school_id,
                student_id,
                enrollment_id,
                academic_session_id,
                term_id,
                fee_structure_id,
                total_due,
                total_paid,
                status,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                studentId,
                enrollmentId,
                enrollment.academic_session_id,
                termId,
                feeStructure.id,
                totalDue,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message:
                "Student financial account created successfully.",
            financialAccount:
                result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A financial account already exists for this student, enrollment, and term.",
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
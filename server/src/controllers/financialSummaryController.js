
import pool from "../config/db.js";

export const getFinancialSummary = async (req, res) => {
    const { schoolId } = req;

    try {
        // Actual collections and outstanding balances come from
        // existing student financial accounts.
        const summaryResult = await pool.query(
            `
            SELECT
                COALESCE(SUM(sfa.total_paid), 0)
                    AS total_collected,

                COALESCE(
                    SUM(
                        GREATEST(
                            sfa.total_due - sfa.total_paid,
                            0
                        )
                    ),
                    0
                ) AS outstanding_fees

            FROM student_financial_accounts sfa
            WHERE sfa.school_id = $1;
            `,
            [schoolId]
        );

        // Calculate expected fees using the current academic
        // session, current term, current fee structures and
        // active student enrolments.
        const expectedFeesResult = await pool.query(
            `
            WITH current_context AS (
                SELECT
                    a.id AS academic_session_id,
                    a.name AS academic_session_name,
                    t.id AS term_id,
                    t.name AS term_name

                FROM academic_sessions a

                JOIN terms t
                    ON t.academic_session_id = a.id
                   AND t.is_current = TRUE

                WHERE a.school_id = $1
                  AND a.is_current = TRUE
            ),

            active_enrolments AS (
                SELECT
                    c.academic_level_id,
                    al.name AS academic_level_name,
                    al.display_order,
                    COUNT(DISTINCT se.student_id)::INTEGER
                        AS active_enrollment_count

                FROM student_enrollments se

                JOIN current_context cc
                    ON cc.academic_session_id =
                       se.academic_session_id

                    JOIN students s
                        ON s.id = se.student_id
                        AND s.school_id = se.school_id
                        AND s.status = 'active'


                JOIN classes c
                    ON c.id = se.class_id

                JOIN academic_levels al
                    ON al.id = c.academic_level_id

                WHERE se.school_id = $1
                  AND se.status = 'active'

                GROUP BY
                    c.academic_level_id,
                    al.name,
                    al.display_order
            ),

            current_fee_structures AS (
                SELECT
                    fs.id AS fee_structure_id,
                    fs.academic_level_id,
                    fs.name AS fee_structure_name,

                    COALESCE(SUM(fsi.amount), 0)
                        AS fee_per_student

                FROM fee_structures fs

                JOIN current_context cc
                    ON cc.academic_session_id =
                       fs.academic_session_id
                   AND cc.term_id = fs.term_id

                LEFT JOIN fee_structure_items fsi
                    ON fsi.fee_structure_id = fs.id

                WHERE fs.school_id = $1
                  AND fs.is_current = TRUE

                GROUP BY
                    fs.id,
                    fs.academic_level_id,
                    fs.name
            )

            SELECT
                cc.academic_session_id,
                cc.academic_session_name,
                cc.term_id,
                cc.term_name,

                ae.academic_level_id,
                ae.academic_level_name,
                ae.active_enrollment_count,

                cfs.fee_structure_id,
                cfs.fee_structure_name,

                COALESCE(cfs.fee_per_student, 0)
                    AS fee_per_student,

                (
                    COALESCE(cfs.fee_per_student, 0)
                    * ae.active_enrollment_count
                ) AS expected_fees

            FROM current_context cc

            CROSS JOIN active_enrolments ae

            LEFT JOIN current_fee_structures cfs
                ON cfs.academic_level_id =
                   ae.academic_level_id

            ORDER BY ae.display_order ASC;
            `,
            [schoolId]
        );

        // Preserve the existing session-and-term breakdown
        // for actual collections and outstanding balances.
        const breakdownResult = await pool.query(
            `
            SELECT
                a.id AS academic_session_id,
                a.name AS academic_session_name,

                t.id AS term_id,
                t.name AS term_name,

                COALESCE(SUM(sfa.total_due), 0)
                    AS expected_fees,

                COALESCE(SUM(sfa.total_paid), 0)
                    AS total_collected,

                COALESCE(
                    SUM(
                        GREATEST(
                            sfa.total_due - sfa.total_paid,
                            0
                        )
                    ),
                    0
                ) AS outstanding_fees

            FROM student_financial_accounts sfa

            JOIN academic_sessions a
                ON a.id = sfa.academic_session_id

            JOIN terms t
                ON t.id = sfa.term_id

            WHERE sfa.school_id = $1

            GROUP BY
                a.id,
                a.name,
                t.id,
                t.name

            ORDER BY
                a.name DESC,
                t.name ASC;
            `,
            [schoolId]
        );

        const expensesResult = await pool.query(
            `
            SELECT COALESCE(SUM(e.amount), 0)
                AS total_expenses
            FROM expenses e
            WHERE e.school_id = $1;
            `,
            [schoolId]
        );

        const summary = summaryResult.rows[0];

        const totalCollected = Number(summary.total_collected);
        const outstandingFees = Number(summary.outstanding_fees);
        const totalExpenses = Number(
            expensesResult.rows[0].total_expenses
        );

        const academicLevelBreakdown =
            expectedFeesResult.rows.map((row) => ({
                academicSessionId: row.academic_session_id,
                academicSessionName: row.academic_session_name,
                termId: row.term_id,
                termName: row.term_name,

                academicLevelId: row.academic_level_id,
                academicLevelName: row.academic_level_name,

                feeStructureId: row.fee_structure_id,
                feeStructureName: row.fee_structure_name,

                feePerStudent: Number(row.fee_per_student),
                activeEnrollmentCount: Number(
                    row.active_enrollment_count
                ),
                expectedFees: Number(row.expected_fees),

                hasCurrentFeeStructure:
                    row.fee_structure_id !== null,
            }));

        const expectedFees = academicLevelBreakdown.reduce(
            (total, level) => total + level.expectedFees,
            0
        );

        const breakdown = breakdownResult.rows.map((row) => ({
            academicSessionId: row.academic_session_id,
            academicSessionName: row.academic_session_name,
            termId: row.term_id,
            termName: row.term_name,
            expectedFees: Number(row.expected_fees),
            totalCollected: Number(row.total_collected),
            outstandingFees: Number(row.outstanding_fees),
        }));

        return res.status(200).json({
            expectedFees,
            totalCollected,
            outstandingFees,
            totalExpenses,
            netBalance: totalCollected - totalExpenses,
            breakdown,
            academicLevelBreakdown,
        });
    } catch (error) {
        console.error(
            "Get financial summary error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch financial summary.",
        });
    }
};

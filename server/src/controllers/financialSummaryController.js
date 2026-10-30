
import pool from "../config/db.js";

export const getFinancialSummary = async (req, res) => {
    const { schoolId } = req;

    try {
        const summaryResult = await pool.query(
            `
            SELECT
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

            JOIN fee_structures fs
                ON fs.id = sfa.fee_structure_id

            WHERE sfa.school_id = $1
              AND fs.is_current = TRUE;
            `,
            [schoolId]
        );

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

            JOIN fee_structures fs
                ON fs.id = sfa.fee_structure_id

            JOIN academic_sessions a
                ON a.id = sfa.academic_session_id

            JOIN terms t
                ON t.id = sfa.term_id

            WHERE sfa.school_id = $1
              AND fs.is_current = TRUE

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

        const expectedFees = Number(summary.expected_fees);
        const totalCollected = Number(summary.total_collected);
        const outstandingFees = Number(summary.outstanding_fees);
        const totalExpenses = Number(
            expensesResult.rows[0].total_expenses
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
        });
    } catch (error) {
        console.error("Get financial summary error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch financial summary.",
        });
    }
};

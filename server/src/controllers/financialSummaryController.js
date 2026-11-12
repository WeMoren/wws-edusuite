
import pool from "../config/db.js";

const isValidUuid = (value) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);


export const getFinancialSummary = async (req, res) => {
    const { schoolId } = req;
    const {
        academicSessionId,
        termId,
    } = req.query;

    try {
        const sessionProvided =
            academicSessionId !== undefined;

        const termProvided =
            termId !== undefined;

        // Both period identifiers must be supplied together.
        if (sessionProvided !== termProvided) {
            return res.status(400).json({
                message:
                    "Academic session and term must be selected together.",
            });
        }

        if (
            sessionProvided &&
            (
                !isValidUuid(academicSessionId) ||
                !isValidUuid(termId)
            )
        ) {
            return res.status(400).json({
                message:
                    "A valid academic session and term are required.",
            });
        }

        // Resolve the selected reporting period.
        // When no period is supplied, retain backward compatibility
        // by using the school's current session and current term.
        const periodResult = sessionProvided
            ? await pool.query(
                `
                SELECT
                    a.id AS academic_session_id,
                    a.name AS academic_session_name,
                    a.is_current AS session_is_current,

                    t.id AS term_id,
                    t.name AS term_name,
                    t.is_current AS term_is_current

                FROM academic_sessions a

                JOIN terms t
                    ON t.academic_session_id = a.id
                   AND t.school_id = a.school_id

                WHERE a.school_id = $1
                  AND a.id = $2
                  AND t.id = $3;
                `,
                [
                    schoolId,
                    academicSessionId,
                    termId,
                ]
            )
            : await pool.query(
                `
                SELECT
                    a.id AS academic_session_id,
                    a.name AS academic_session_name,
                    a.is_current AS session_is_current,

                    t.id AS term_id,
                    t.name AS term_name,
                    t.is_current AS term_is_current

                FROM academic_sessions a

                JOIN terms t
                    ON t.academic_session_id = a.id
                   AND t.school_id = a.school_id

                WHERE a.school_id = $1
                  AND a.is_current = TRUE
                  AND t.is_current = TRUE
                LIMIT 1;
                `,
                [schoolId]
            );

        if (periodResult.rows.length === 0) {
            return res.status(404).json({
                message: sessionProvided
                    ? "The selected academic session and term were not found for this school."
                    : "No current academic session and term are configured for this school.",
            });
        }

        const period = periodResult.rows[0];

        const selectedSessionId =
            period.academic_session_id;

        const selectedTermId =
            period.term_id;

        const isCurrentPeriod =
            period.session_is_current &&
            period.term_is_current;

        // Actual expected fees, collections and outstanding balances
        // are based on the selected period's financial-account snapshots.
        const summaryResult = await pool.query(
            `
            SELECT
                COALESCE(SUM(sfa.total_due), 0)
                    AS account_expected_fees,

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

            WHERE sfa.school_id = $1
              AND sfa.academic_session_id = $2
              AND sfa.term_id = $3;
            `,
            [
                schoolId,
                selectedSessionId,
                selectedTermId,
            ]
        );

        // Find eligible current-period enrolments that do not yet
        // have financial accounts.
        //
        // This fallback is deliberately disabled for historical periods.
        // It mirrors the account-generation eligibility rules without
        // creating or modifying any financial accounts.
        const missingAccountsResult = await pool.query(
            `
            WITH active_fee_structures AS (
                SELECT
                    fs.academic_level_id,

                    SUM(fsi.amount) AS fee_per_student

                FROM fee_structures fs

                JOIN fee_structure_items fsi
                    ON fsi.fee_structure_id = fs.id

                WHERE fs.school_id = $1
                  AND fs.academic_session_id = $2
                  AND fs.term_id = $3
                  AND fs.is_current = TRUE

                GROUP BY fs.academic_level_id
            )

            SELECT
                COALESCE(SUM(afs.fee_per_student), 0)
                    AS missing_expected_fees

            FROM student_enrollments se

            JOIN students s
                ON s.id = se.student_id
               AND s.school_id = se.school_id
               AND s.status = 'active'

            JOIN classes c
                ON c.id = se.class_id
               AND c.school_id = se.school_id
               AND c.academic_session_id =
                   se.academic_session_id

            JOIN active_fee_structures afs
                ON afs.academic_level_id =
                   c.academic_level_id

            LEFT JOIN student_financial_accounts sfa
                ON sfa.school_id = se.school_id
               AND sfa.student_id = se.student_id
               AND sfa.enrollment_id = se.id
               AND sfa.academic_session_id =
                   se.academic_session_id
               AND sfa.term_id = $3

            WHERE $4::BOOLEAN = TRUE
              AND se.school_id = $1
              AND se.academic_session_id = $2
              AND se.status = 'active'
              AND sfa.id IS NULL;
            `,
            [
                schoolId,
                selectedSessionId,
                selectedTermId,
                isCurrentPeriod,
            ]
        );

        // Preserve the existing all-period session-and-term breakdown.
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
               AND a.school_id = sfa.school_id

            JOIN terms t
                ON t.id = sfa.term_id
               AND t.school_id = sfa.school_id
               AND t.academic_session_id =
                   sfa.academic_session_id

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

        // Build the academic-level breakdown from historical account
        // enrolments, plus eligible missing current-period accounts.
        const academicLevelResult = await pool.query(
            `
            WITH period_accounts AS (
                SELECT
                    sfa.id AS financial_account_id,
                    sfa.enrollment_id,
                    sfa.total_due,
                    sfa.total_paid,

                    c.academic_level_id,
                    al.name AS academic_level_name,
                    al.display_order

                FROM student_financial_accounts sfa

                JOIN student_enrollments se
                    ON se.id = sfa.enrollment_id
                   AND se.school_id = sfa.school_id
                   AND se.student_id = sfa.student_id
                   AND se.academic_session_id =
                       sfa.academic_session_id

                JOIN classes c
                    ON c.id = se.class_id
                   AND c.school_id = se.school_id
                   AND c.academic_session_id =
                       se.academic_session_id

                JOIN academic_levels al
                    ON al.id = c.academic_level_id
                   AND al.school_id = c.school_id

                WHERE sfa.school_id = $1
                  AND sfa.academic_session_id = $2
                  AND sfa.term_id = $3
            ),

            account_level_totals AS (
                SELECT
                    academic_level_id,
                    academic_level_name,
                    display_order,

                    COUNT(DISTINCT enrollment_id)::INTEGER
                        AS enrollment_count,

                    SUM(total_due) AS expected_fees,
                    SUM(total_paid) AS total_collected,

                    TRUE AS has_fee_data

                FROM period_accounts

                GROUP BY
                    academic_level_id,
                    academic_level_name,
                    display_order
            ),

            active_fee_structures AS (
                SELECT
                    fs.academic_level_id,
                    SUM(fsi.amount) AS fee_per_student

                FROM fee_structures fs

                JOIN fee_structure_items fsi
                    ON fsi.fee_structure_id = fs.id

                WHERE fs.school_id = $1
                  AND fs.academic_session_id = $2
                  AND fs.term_id = $3
                  AND fs.is_current = TRUE

                GROUP BY fs.academic_level_id
            ),

            missing_current_enrolments AS (
                SELECT
                    se.id AS enrollment_id,

                    c.academic_level_id,
                    al.name AS academic_level_name,
                    al.display_order,

                    afs.fee_per_student

                FROM student_enrollments se

                JOIN students s
                    ON s.id = se.student_id
                   AND s.school_id = se.school_id
                   AND s.status = 'active'

                JOIN classes c
                    ON c.id = se.class_id
                   AND c.school_id = se.school_id
                   AND c.academic_session_id =
                       se.academic_session_id

                JOIN academic_levels al
                    ON al.id = c.academic_level_id
                   AND al.school_id = c.school_id

                JOIN active_fee_structures afs
                    ON afs.academic_level_id =
                       c.academic_level_id

                LEFT JOIN student_financial_accounts sfa
                    ON sfa.school_id = se.school_id
                   AND sfa.student_id = se.student_id
                   AND sfa.enrollment_id = se.id
                   AND sfa.academic_session_id =
                       se.academic_session_id
                   AND sfa.term_id = $3

                WHERE $4::BOOLEAN = TRUE
                  AND se.school_id = $1
                  AND se.academic_session_id = $2
                  AND se.status = 'active'
                  AND sfa.id IS NULL
            ),

            missing_level_totals AS (
                SELECT
                    academic_level_id,
                    academic_level_name,
                    display_order,

                    COUNT(DISTINCT enrollment_id)::INTEGER
                        AS enrollment_count,

                    SUM(fee_per_student) AS expected_fees,

                    0::NUMERIC AS total_collected,

                    TRUE AS has_fee_data

                FROM missing_current_enrolments

                GROUP BY
                    academic_level_id,
                    academic_level_name,
                    display_order
            ),

            combined_level_totals AS (
                SELECT * FROM account_level_totals

                UNION ALL

                SELECT * FROM missing_level_totals
            )

            SELECT
                academic_level_id,
                academic_level_name,
                display_order,

                SUM(enrollment_count)::INTEGER
                    AS enrollment_count,

                SUM(expected_fees)
                    AS expected_fees,

                SUM(total_collected)
                    AS total_collected,

                BOOL_OR(has_fee_data)
                    AS has_fee_data

            FROM combined_level_totals

            GROUP BY
                academic_level_id,
                academic_level_name,
                display_order

            ORDER BY display_order ASC;
            `,
            [
                schoolId,
                selectedSessionId,
                selectedTermId,
                isCurrentPeriod,
            ]
        );

        // Only expenses explicitly assigned to the selected period
        // contribute to its expense total.
        const expensesResult = await pool.query(
            `
            SELECT
                COALESCE(SUM(e.amount), 0)
                    AS total_expenses

            FROM expenses e

            WHERE e.school_id = $1
              AND e.academic_session_id = $2
              AND e.term_id = $3;
            `,
            [
                schoolId,
                selectedSessionId,
                selectedTermId,
            ]
        );

        // Unallocated expenses remain visible separately and are
        // never silently included in a selected academic period.
        const unallocatedExpensesResult = await pool.query(
            `
            SELECT
                COALESCE(SUM(e.amount), 0)
                    AS unallocated_expenses

            FROM expenses e

            WHERE e.school_id = $1
              AND e.academic_session_id IS NULL
              AND e.term_id IS NULL;
            `,
            [schoolId]
        );

        const summary = summaryResult.rows[0];

        const accountExpectedFees = Number(
            summary.account_expected_fees
        );

        const missingExpectedFees = Number(
            missingAccountsResult.rows[0].missing_expected_fees
        );

        const expectedFees =
            accountExpectedFees + missingExpectedFees;

        const totalCollected = Number(
            summary.total_collected
        );

        const outstandingFees = Number(
            summary.outstanding_fees
        );

        const totalExpenses = Number(
            expensesResult.rows[0].total_expenses
        );

        const unallocatedExpenses = Number(
            unallocatedExpensesResult.rows[0].unallocated_expenses
        );

        const academicLevelBreakdown =
            academicLevelResult.rows.map((row) => {
                const levelExpectedFees = Number(
                    row.expected_fees
                );

                const enrollmentCount = Number(
                    row.enrollment_count
                );

                return {
                    academicSessionId: selectedSessionId,
                    academicSessionName:
                        period.academic_session_name,

                    termId: selectedTermId,
                    termName: period.term_name,

                    academicLevelId:
                        row.academic_level_id,

                    academicLevelName:
                        row.academic_level_name,

                    feePerStudent:
                        enrollmentCount > 0
                            ? levelExpectedFees / enrollmentCount
                            : 0,

                    activeEnrollmentCount:
                        enrollmentCount,

                    expectedFees: levelExpectedFees,

                    totalCollected: Number(
                        row.total_collected
                    ),

                    hasCurrentFeeStructure:
                        row.has_fee_data,
                };
            });

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
            academicSessionId: selectedSessionId,
            academicSessionName: period.academic_session_name,

            termId: selectedTermId,
            termName: period.term_name,

            expectedFees,
            totalCollected,
            outstandingFees,

            totalExpenses,
            unallocatedExpenses,

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

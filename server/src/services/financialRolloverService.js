import {
    createStudentFinancialAccountForTerm,
} from "./studentFinancialAccountService.js";


export const generateFinancialAccountsForCurrentTerm = async (
    client,
    { schoolId }
) => {
    const sessionResult = await client.query(
        `
        SELECT
            id,
            name
        FROM academic_sessions
        WHERE school_id = $1
          AND is_current = TRUE
        FOR SHARE;
        `,
        [schoolId]
    );

    if (sessionResult.rows.length === 0) {
        return {
            processed: false,
            reason: "No current academic session exists.",
            createdCount: 0,
            existingCount: 0,
            skippedCount: 0,
        };
    }

    if (sessionResult.rows.length > 1) {
        throw new Error(
            "Multiple current academic sessions exist for this school."
        );
    }

    const academicSession = sessionResult.rows[0];

    const termResult = await client.query(
        `
        SELECT
            id,
            name
        FROM terms
        WHERE school_id = $1
          AND academic_session_id = $2
          AND is_current = TRUE
        FOR SHARE;
        `,
        [
            schoolId,
            academicSession.id,
        ]
    );

    if (termResult.rows.length === 0) {
        return {
            processed: false,
            reason: "No current term exists for the current academic session.",
            createdCount: 0,
            existingCount: 0,
            skippedCount: 0,
        };
    }

    if (termResult.rows.length > 1) {
        throw new Error(
            "Multiple current terms exist for the current academic session."
        );
    }

    const currentTerm = termResult.rows[0];

    const enrollmentResult = await client.query(
        `
        SELECT
            e.id AS enrollment_id,
            e.student_id
        FROM student_enrollments e

        JOIN students s
            ON s.id = e.student_id
           AND s.school_id = e.school_id

        WHERE e.school_id = $1
          AND e.academic_session_id = $2
          AND e.status = 'active'
          AND s.status = 'active'

        ORDER BY e.id ASC

        FOR UPDATE OF e;
        `,
        [
            schoolId,
            academicSession.id,
        ]
    );

    let createdCount = 0;
    let existingCount = 0;
    let skippedCount = 0;

    for (const enrollment of enrollmentResult.rows) {
        const result =
            await createStudentFinancialAccountForTerm(
                client,
                {
                    schoolId,
                    studentId: enrollment.student_id,
                    enrollmentId: enrollment.enrollment_id,
                    termId: currentTerm.id,
                }
            );

        if (result.created) {
            createdCount += 1;
        } else if (result.skipped) {
            skippedCount += 1;
        } else {
            existingCount += 1;
        }
    }

    return {
        processed: true,

        academicSession: {
            id: academicSession.id,
            name: academicSession.name,
        },

        term: {
            id: currentTerm.id,
            name: currentTerm.name,
        },

        eligibleEnrollmentCount: enrollmentResult.rows.length,
        createdCount,
        existingCount,
        skippedCount,
    };
};

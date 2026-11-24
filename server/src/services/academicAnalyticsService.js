
import pool from "../config/db.js";

const resolveAcademicAnalyticsPeriod = async (
    schoolId,
    academicSessionId,
    termId
) => {
    // No selection: use the school's current session and current term.
    if (!academicSessionId && !termId) {
        const result = await pool.query(
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

        return result.rows[0] || null;
    }

    // A term cannot be selected without its academic session.
    if (!academicSessionId && termId) {
        return null;
    }

    // Explicit session and term selection.
    if (academicSessionId && termId) {
        const result = await pool.query(
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
              AND t.id = $3

            LIMIT 1;
            `,
            [schoolId, academicSessionId, termId]
        );

        return result.rows[0] || null;
    }

    // Historical session without a term:
    // select its latest configured term by display order.
    const result = await pool.query(
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

        ORDER BY
            t.is_current DESC,
            t.display_order DESC,
            t.start_date DESC,
            t.id DESC

        LIMIT 1;
        `,
        [schoolId, academicSessionId]
    );

    return result.rows[0] || null;
};



const toNumberOrNull = (value) =>
    value === null || value === undefined
        ? null
        : Number(value);

export const getAcademicPerformanceAnalytics = async ({
    schoolId,
    academicSessionId = null,
    termId = null,
}) => {
    const period = await resolveAcademicAnalyticsPeriod(
        schoolId,
        academicSessionId,
        termId
    );

    if (!period) {
        return null;
    }

    const queryParams = [
        schoolId,
        period.term_id,
    ];

    const [
        summaryResult,
        gradeResult,
        classResult,
        academicLevelResult,
        subjectResult,
    ] = await Promise.all([
        // Overall performance and historical snapshot coverage.
        pool.query(
            `
            SELECT
                COUNT(*) AS finalized_documents,

                AVG(term_average)
                    AS overall_average,

                COUNT(term_total_score)
                    AS documents_with_total_score,

                COUNT(term_average)
                    AS documents_with_average,

                COUNT(term_grade)
                    AS documents_with_grade,

                COUNT(*) FILTER (
                    WHERE NULLIF(TRIM(class_name), '') IS NOT NULL
                ) AS documents_with_class,

                COUNT(*) FILTER (
                    WHERE NULLIF(TRIM(academic_level_name), '') IS NOT NULL
                ) AS documents_with_academic_level,

                COUNT(*) FILTER (
                    WHERE
                        NULLIF(TRIM(academic_level_name), '') IS NOT NULL
                        AND NULLIF(TRIM(class_name), '') IS NOT NULL
                ) AS documents_with_class_and_academic_level,

                COUNT(
                    DISTINCT (academic_level_name, class_name)
                ) FILTER (
                    WHERE
                        NULLIF(TRIM(academic_level_name), '') IS NOT NULL
                        AND NULLIF(TRIM(class_name), '') IS NOT NULL
                ) AS classes_represented

            FROM result_documents

            WHERE school_id = $1
              AND term_id = $2
              AND status = 'finalized';
            `,
            queryParams
        ),

        // Historical grade distribution.
        pool.query(
            `
            SELECT
                term_grade AS grade,
                COUNT(*) AS student_count

            FROM result_documents

            WHERE school_id = $1
              AND term_id = $2
              AND status = 'finalized'
              AND term_grade IS NOT NULL

            GROUP BY term_grade
            ORDER BY student_count DESC, term_grade ASC;
            `,
            queryParams
        ),

        // Class performance, keeping classes with identical names
        // in different academic levels separate.
        pool.query(
            `
            SELECT
                academic_level_name,
                class_name,

                COUNT(*) AS finalized_documents,
                COUNT(term_average) AS documents_with_average,

                AVG(term_average) AS average_performance

            FROM result_documents

            WHERE school_id = $1
              AND term_id = $2
              AND status = 'finalized'
              AND NULLIF(TRIM(academic_level_name), '') IS NOT NULL
              AND NULLIF(TRIM(class_name), '') IS NOT NULL

            GROUP BY
                academic_level_name,
                class_name

            ORDER BY
                academic_level_name ASC,
                class_name ASC;
            `,
            queryParams
        ),

        // Academic-level performance.
        pool.query(
            `
            SELECT
                academic_level_name,

                COUNT(*) AS finalized_documents,
                COUNT(term_average) AS documents_with_average,

                AVG(term_average) AS average_performance

            FROM result_documents

            WHERE school_id = $1
              AND term_id = $2
              AND status = 'finalized'
              AND NULLIF(TRIM(academic_level_name), '') IS NOT NULL

            GROUP BY academic_level_name
            ORDER BY academic_level_name ASC;
            `,
            queryParams
        ),

        // Subject performance from actual results belonging to finalized documents.
        pool.query(
            `
            SELECT
                rd.academic_level_name,

                s.id AS subject_id,
                s.name AS subject_name,
                s.code AS subject_code,

                COUNT(DISTINCT rd.student_enrollment_id)
                    AS students_with_subject,

                COUNT(r.id) AS result_entries,

                AVG(r.total) AS average_score,
                MAX(r.total) AS highest_score,
                MIN(r.total) AS lowest_score

            FROM result_documents rd

            JOIN results r
                ON r.school_id = rd.school_id
               AND r.student_enrollment_id = rd.student_enrollment_id
               AND r.term_id = rd.term_id

            JOIN subjects s
                ON s.id = r.subject_id
               AND s.school_id = r.school_id

            WHERE rd.school_id = $1
              AND rd.term_id = $2
              AND rd.status = 'finalized'
              AND NULLIF(TRIM(rd.academic_level_name), '') IS NOT NULL

            GROUP BY
                rd.academic_level_name,
                s.id,
                s.name,
                s.code

            ORDER BY
                rd.academic_level_name ASC,
                s.name ASC,
                s.code ASC;
            `,
            queryParams
        ),
    ]);

    

    const summary = summaryResult.rows[0];

    const finalizedDocuments = Number(
        summary.finalized_documents
    );

    const documentsWithGrade = Number(
        summary.documents_with_grade
    );

    const gradeDistribution = gradeResult.rows.map((row) => {
        const studentCount = Number(row.student_count);

        return {
            grade: row.grade,
            studentCount,

            percentage: documentsWithGrade > 0
                ? Number(
                    (
                        (studentCount / documentsWithGrade) * 100
                    ).toFixed(2)
                )
                : 0,
        };
    });

    const classPerformance = classResult.rows.map((row) => ({
        academicLevelName: row.academic_level_name,
        className: row.class_name,

        finalizedDocuments: Number(
            row.finalized_documents
        ),

        documentsWithAverage: Number(
            row.documents_with_average
        ),

        averagePerformance: toNumberOrNull(
            row.average_performance
        ),
    }));

    const academicLevelPerformance =
        academicLevelResult.rows.map((row) => ({
            academicLevelName: row.academic_level_name,

            finalizedDocuments: Number(
                row.finalized_documents
            ),

            documentsWithAverage: Number(
                row.documents_with_average
            ),

            averagePerformance: toNumberOrNull(
                row.average_performance
            ),
        }));

    const subjectPerformance = subjectResult.rows.map((row) => ({
        academicLevelName: row.academic_level_name,

        subjectId: row.subject_id,
        subjectName: row.subject_name,
        subjectCode: row.subject_code,

        studentsWithSubject: Number(
            row.students_with_subject
        ),

        resultEntries: Number(
            row.result_entries
        ),

        averageScore: toNumberOrNull(
            row.average_score
        ),

        highestScore: toNumberOrNull(
            row.highest_score
        ),

        lowestScore: toNumberOrNull(
            row.lowest_score
        ),
    }));  

    return {
        academicSessionId: period.academic_session_id,
        academicSessionName: period.academic_session_name,

        termId: period.term_id,
        termName: period.term_name,

        summary: {
            overallAverage: toNumberOrNull(
                summary.overall_average
            ),

            finalizedDocuments,

            classesRepresented: Number(
                summary.classes_represented
            ),
        },

        dataCoverage: {
            finalizedDocuments,

            documentsWithTotalScore: Number(
                summary.documents_with_total_score
            ),

            documentsWithAverage: Number(
                summary.documents_with_average
            ),

            documentsWithGrade,

            documentsWithClass: Number(
                summary.documents_with_class
            ),

            documentsWithAcademicLevel: Number(
                summary.documents_with_academic_level
            ),

            documentsWithClassAndAcademicLevel: Number(
                summary.documents_with_class_and_academic_level
            ),
        },

        gradeDistribution,
        classPerformance,
        academicLevelPerformance,
        subjectPerformance,
    };
};

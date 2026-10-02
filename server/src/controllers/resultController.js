import pool from "../config/db.js";

export const getResults = async (req, res) => {
    try {
        const { schoolId } = req;
        const { studentEnrollmentId, termId } = req.query;

        const values = [schoolId];
        const conditions = ["r.school_id = $1"];

        if (studentEnrollmentId) {
            values.push(studentEnrollmentId);
            conditions.push(
                `r.student_enrollment_id = $${values.length}`
            );
        }

        if (termId) {
            values.push(termId);
            conditions.push(
                `r.term_id = $${values.length}`
            );
        }

        const result = await pool.query(
            `
            SELECT
                r.id,
                r.student_enrollment_id,
                r.term_id,
                r.subject_id,
                r.ca,
                r.exam,
                r.total,
                r.grade,
                r.remark,
                r.created_at,
                r.updated_at,

                s.name AS subject_name,
                s.code AS subject_code,

                st.id AS student_id,
                st.first_name,
                st.middle_name,
                st.last_name,
                st.admission_no AS admission_number,

                t.name AS term_name,
                a_s.name AS academic_session_name

            FROM results r

            INNER JOIN subjects s
                ON s.id = r.subject_id

            INNER JOIN student_enrollments se
                ON se.id = r.student_enrollment_id

            INNER JOIN students st
                ON st.id = se.student_id

            INNER JOIN terms t
                ON t.id = r.term_id

            INNER JOIN academic_sessions a_s
                ON a_s.id = t.academic_session_id

            WHERE ${conditions.join(" AND ")}

            ORDER BY
                st.last_name,
                st.first_name,
                s.name;
            `,
            values
        );

        return res.status(200).json({
            results: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch results:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to fetch results.",
        });
    }
};


export const createResult = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const {
            studentEnrollmentId,
            termId,
            subjectId,
            ca,
            exam,
        } = req.body;

        if (
            !studentEnrollmentId ||
            !termId ||
            !subjectId ||
            ca === undefined ||
            exam === undefined
        ) {
            return res.status(400).json({
                message:
                    "Student enrollment, term, subject, CA, and exam are required.",
            });
        }

        const caScore = Number(ca);
        const examScore = Number(exam);

        if (
            !Number.isFinite(caScore) ||
            !Number.isFinite(examScore)
        ) {
            return res.status(400).json({
                message:
                    "CA and exam scores must be valid numbers.",
            });
        }

        await client.query("BEGIN");

        /*
         * Get the enrollment and its academic assignment.
         */
        const enrollmentResult = await client.query(
            `
            SELECT
                se.id,
                se.student_id,
                se.academic_session_id,
                se.class_id,
                se.section_id,
                se.stream_id,
                se.subject_combination_id,
                c.academic_level_id
            FROM student_enrollments se

            INNER JOIN classes c
                ON c.id = se.class_id

            WHERE se.id = $1
              AND se.school_id = $2
            FOR UPDATE;
            `,
            [studentEnrollmentId, schoolId]
        );

        if (enrollmentResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Student enrollment not found.",
            });
        }

        const enrollment = enrollmentResult.rows[0];

        /*
         * Make sure the term belongs to the same academic
         * session as the student's enrollment.
         */
        const termResult = await client.query(
            `
            SELECT
                id,
                academic_session_id,
                name
            FROM terms
            WHERE id = $1
              AND school_id = $2;
            `,
            [termId, schoolId]
        );

        if (termResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Term not found.",
            });
        }

        const term = termResult.rows[0];

        if (
            term.academic_session_id !==
            enrollment.academic_session_id
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "The selected term does not belong to the student's academic session.",
            });
        }



                /*
         * A finalized result document protects
         * all result records for that student and term.
         */
        const finalizedDocument = await client.query(
            `
            SELECT id
            FROM result_documents
            WHERE student_enrollment_id = $1
              AND term_id = $2
              AND school_id = $3
              AND status = 'finalized';
            `,
            [
                studentEnrollmentId,
                termId,
                schoolId,
            ]
        );

        if (finalizedDocument.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "This result cannot be created because the student's result document has been finalized.",
            });
        }

        /*
         * Check whether the result already exists.
         */
        const existingResult = await client.query(
            `
            SELECT id
            FROM results
            WHERE student_enrollment_id = $1
              AND term_id = $2
              AND subject_id = $3;
            `,
            [
                studentEnrollmentId,
                termId,
                subjectId,
            ]
        );

        if (existingResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "A result already exists for this student, term, and subject.",
            });
        }

        /*
         * Validate the subject belongs to this school and
         * is applicable to the enrollment's academic level.
         */
        const subjectResult = await client.query(
            `
            SELECT
                s.id,
                s.name,
                s.code
            FROM subjects s

            INNER JOIN subject_academic_levels sal
                ON sal.subject_id = s.id

            WHERE s.id = $1
              AND s.school_id = $2
              AND sal.academic_level_id = $3;
            `,
            [
                subjectId,
                schoolId,
                enrollment.academic_level_id,
            ]
        );

        if (subjectResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "The selected subject is not applicable to the student's academic level.",
            });
        }

        /*
         * If the enrollment has a subject combination,
         * the subject must belong to that combination.
         */
        if (enrollment.subject_combination_id) {
            const combinationSubjectResult =
                await client.query(
                    `
                    SELECT id
                    FROM subject_combination_subjects
                    WHERE subject_combination_id = $1
                      AND subject_id = $2;
                    `,
                    [
                        enrollment.subject_combination_id,
                        subjectId,
                    ]
                );

            if (
                combinationSubjectResult.rows.length === 0
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "The selected subject is not part of the student's subject combination.",
                });
            }
        }

        /*
         * Read the school's assessment settings.
         */
        const assessmentSettingsResult =
            await client.query(
                `
                SELECT
                    ca_max,
                    exam_max
                FROM assessment_settings
                WHERE school_id = $1;
                `,
                [schoolId]
            );

        if (
            assessmentSettingsResult.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "Assessment settings have not been configured for this school.",
            });
        }

        const assessmentSettings =
            assessmentSettingsResult.rows[0];

        const caMax = Number(
            assessmentSettings.ca_max
        );

        const examMax = Number(
            assessmentSettings.exam_max
        );

        if (caScore < 0 || caScore > caMax) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    `CA score must be between 0 and ${caMax}.`,
            });
        }

        if (
            examScore < 0 ||
            examScore > examMax
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    `Exam score must be between 0 and ${examMax}.`,
            });
        }

        const total = caScore + examScore;

        /*
         * Find the school's grading scale entry.
         */
        const gradingScaleResult = await client.query(
            `
            SELECT
                grade,
                remark
            FROM grading_scales
            WHERE school_id = $1
              AND min_score <= $2
              AND max_score >= $2
            ORDER BY min_score DESC;
            `,
            [schoolId, total]
        );

        if (gradingScaleResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "No grading scale matches the calculated total.",
            });
        }

        if (gradingScaleResult.rows.length > 1) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "The school's grading scale contains overlapping score ranges.",
            });
        }

        const gradingScale =
            gradingScaleResult.rows[0];

        /*
         * Insert the result.
         */
        const result = await client.query(
            `
            INSERT INTO results (
                school_id,
                student_enrollment_id,
                term_id,
                subject_id,
                ca,
                exam,
                total,
                grade,
                remark
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
                $9
            )
            RETURNING
                id,
                student_enrollment_id,
                term_id,
                subject_id,
                ca,
                exam,
                total,
                grade,
                remark,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                studentEnrollmentId,
                termId,
                subjectId,
                caScore,
                examScore,
                total,
                gradingScale.grade,
                gradingScale.remark,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message:
                "Result created successfully.",
            result: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A result already exists for this student, term, and subject.",
            });
        }

        console.error(
            "Failed to create result:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to create result.",
        });
    } finally {
        client.release();
    }
};



export const getResultById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                r.id,
                r.student_enrollment_id,
                r.term_id,
                r.subject_id,
                r.ca,
                r.exam,
                r.total,
                r.grade,
                r.remark,
                r.created_at,
                r.updated_at,

                s.name AS subject_name,
                s.code AS subject_code,

                st.id AS student_id,
                st.first_name,
                st.middle_name,
                st.last_name,
                st.admission_no AS admission_number,

                t.name AS term_name,
                a_s.name AS academic_session_name,

                al.name AS academic_level_name,
                c.name AS class_name,
                sec.name AS section_name,

                str.name AS stream_name,
                sc.name AS subject_combination_name

            FROM results r

            INNER JOIN subjects s
                ON s.id = r.subject_id

            INNER JOIN student_enrollments se
                ON se.id = r.student_enrollment_id

            INNER JOIN students st
                ON st.id = se.student_id

            INNER JOIN terms t
                ON t.id = r.term_id

            INNER JOIN academic_sessions a_s
                ON a_s.id = t.academic_session_id

            INNER JOIN classes c
                ON c.id = se.class_id

            INNER JOIN academic_levels al
                ON al.id = c.academic_level_id

            INNER JOIN sections sec
                ON sec.id = se.section_id

            LEFT JOIN streams str
                ON str.id = se.stream_id

            LEFT JOIN subject_combinations sc
                ON sc.id = se.subject_combination_id

            WHERE r.id = $1
              AND r.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Result not found.",
            });
        }

        return res.status(200).json({
            result: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch result:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch result.",
        });
    }
};



export const updateResult = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;
        const { ca, exam } = req.body;

        if (
            ca === undefined ||
            exam === undefined
        ) {
            return res.status(400).json({
                message:
                    "CA and exam scores are required.",
            });
        }

        const caScore = Number(ca);
        const examScore = Number(exam);

        if (
            !Number.isFinite(caScore) ||
            !Number.isFinite(examScore)
        ) {
            return res.status(400).json({
                message:
                    "CA and exam scores must be valid numbers.",
            });
        }

        await client.query("BEGIN");

        /*
         * Get the existing result and lock it
         * during the transaction.
         */
        const existingResult = await client.query(
            `
            SELECT
                r.id,
                r.student_enrollment_id,
                r.term_id,
                r.subject_id
            FROM results r
            WHERE r.id = $1
              AND r.school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Result not found.",
            });
        }

        const existing = existingResult.rows[0];

        /*
         * A finalized result document protects
         * its underlying result records.
         */
        const finalizedDocument = await client.query(
            `
            SELECT id
            FROM result_documents
            WHERE student_enrollment_id = $1
              AND term_id = $2
              AND school_id = $3
              AND status = 'finalized';
            `,
            [
                existing.student_enrollment_id,
                existing.term_id,
                schoolId,
            ]
        );

        if (finalizedDocument.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "This result cannot be edited because the student's result document has been finalized.",
            });
        }

        /*
         * Read the school's assessment settings.
         */
        const assessmentSettingsResult =
            await client.query(
                `
                SELECT
                    ca_max,
                    exam_max
                FROM assessment_settings
                WHERE school_id = $1;
                `,
                [schoolId]
            );

        if (
            assessmentSettingsResult.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "Assessment settings have not been configured for this school.",
            });
        }

        const assessmentSettings =
            assessmentSettingsResult.rows[0];

        const caMax = Number(
            assessmentSettings.ca_max
        );

        const examMax = Number(
            assessmentSettings.exam_max
        );

        if (caScore < 0 || caScore > caMax) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    `CA score must be between 0 and ${caMax}.`,
            });
        }

        if (
            examScore < 0 ||
            examScore > examMax
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    `Exam score must be between 0 and ${examMax}.`,
            });
        }

        const total = caScore + examScore;

        /*
         * Find the matching grading scale.
         */
        const gradingScaleResult = await client.query(
            `
            SELECT
                grade,
                remark
            FROM grading_scales
            WHERE school_id = $1
              AND min_score <= $2
              AND max_score >= $2
            ORDER BY min_score DESC;
            `,
            [schoolId, total]
        );

        if (gradingScaleResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "No grading scale matches the calculated total.",
            });
        }

        if (gradingScaleResult.rows.length > 1) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "The school's grading scale contains overlapping score ranges.",
            });
        }

        const gradingScale =
            gradingScaleResult.rows[0];

        /*
         * Update the result using the recalculated
         * total, grade, and remark.
         */
        const result = await client.query(
            `
            UPDATE results
            SET
                ca = $1,
                exam = $2,
                total = $3,
                grade = $4,
                remark = $5,
                updated_at = NOW()
            WHERE id = $6
              AND school_id = $7
            RETURNING
                id,
                student_enrollment_id,
                term_id,
                subject_id,
                ca,
                exam,
                total,
                grade,
                remark,
                created_at,
                updated_at;
            `,
            [
                caScore,
                examScore,
                total,
                gradingScale.grade,
                gradingScale.remark,
                id,
                schoolId,
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message:
                "Result updated successfully.",
            result: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Failed to update result:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to update result.",
        });
    } finally {
        client.release();
    }
};




export const deleteResult = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        await client.query("BEGIN");

        /*
         * Get the existing result and lock it
         * during the transaction.
         */
        const existingResult = await client.query(
            `
            SELECT
                id,
                student_enrollment_id,
                term_id
            FROM results
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Result not found.",
            });
        }

        const existing = existingResult.rows[0];

        /*
         * A finalized result document protects
         * its underlying result records.
         */
        const finalizedDocument = await client.query(
            `
            SELECT id
            FROM result_documents
            WHERE student_enrollment_id = $1
              AND term_id = $2
              AND school_id = $3
              AND status = 'finalized';
            `,
            [
                existing.student_enrollment_id,
                existing.term_id,
                schoolId,
            ]
        );

        if (finalizedDocument.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "This result cannot be deleted because the student's result document has been finalized.",
            });
        }

        await client.query(
            `
            DELETE FROM results
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message:
                "Result deleted successfully.",
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Result cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete result:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to delete result.",
        });
    } finally {
        client.release();
    }
};


export const getResultRankings = async (req, res) => {
    try {
        const { schoolId } = req;
        const { termId, classId } = req.query;

        if (!termId || !classId) {
            return res.status(400).json({
                message:
                    "Term and class are required.",
            });
        }

        /*
         * First, make sure the selected term and class
         * belong to the same school.
         */
        const contextResult = await pool.query(
            `
            SELECT
                t.id AS term_id,
                t.name AS term_name,
                t.academic_session_id,

                c.id AS class_id,
                c.name AS class_name,
                c.academic_level_id,

                al.name AS academic_level_name

            FROM terms t

            INNER JOIN classes c
                ON c.academic_session_id = t.academic_session_id

            INNER JOIN academic_levels al
                ON al.id = c.academic_level_id

            WHERE t.id = $1
              AND t.school_id = $2
              AND c.id = $3
              AND c.school_id = $2;
            `,
            [
                termId,
                schoolId,
                classId,
            ]
        );

        if (contextResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "The selected term and class could not be found for this school.",
            });
        }

        const context = contextResult.rows[0];

        /*
         * Build applicability and entered-result counts
         * for every student enrolled in the selected
         * academic level.
         *
         * A student is rankable only when every applicable
         * subject has a result for the selected term.
         */
        const rankingResult = await pool.query(
            `
            WITH applicable_subjects AS (
                SELECT
                    se.id AS student_enrollment_id,
                    s.id AS subject_id

                FROM student_enrollments se

                INNER JOIN classes c
                    ON c.id = se.class_id

                INNER JOIN subjects s
                    ON s.school_id = se.school_id

                INNER JOIN subject_academic_levels sal
                    ON sal.subject_id = s.id
                   AND sal.academic_level_id = c.academic_level_id

                LEFT JOIN subject_combination_subjects scs
                    ON scs.subject_id = s.id
                   AND scs.subject_combination_id =
                       se.subject_combination_id

                WHERE se.school_id = $1
                  AND se.academic_session_id = $2
                  AND c.academic_level_id = $3

                  AND (
                      se.subject_combination_id IS NULL
                      OR scs.subject_id IS NOT NULL
                  )
            ),

            student_subject_summary AS (
                SELECT
                    se.id AS student_enrollment_id,
                    se.student_id,
                    se.class_id,
                    c.academic_level_id,

                    COUNT(DISTINCT aps.subject_id)
                        AS applicable_subject_count,

                    COUNT(DISTINCT r.subject_id)
                        AS entered_result_count,

                    SUM(r.total) AS total_score

                FROM student_enrollments se

                INNER JOIN classes c
                    ON c.id = se.class_id

                INNER JOIN applicable_subjects aps
                    ON aps.student_enrollment_id = se.id

                LEFT JOIN results r
                    ON r.student_enrollment_id = se.id
                   AND r.term_id = $4
                   AND r.subject_id = aps.subject_id
                   AND r.school_id = $1

                WHERE se.school_id = $1
                  AND se.academic_session_id = $2
                  AND c.academic_level_id = $3

                GROUP BY
                    se.id,
                    se.student_id,
                    se.class_id,
                    c.academic_level_id
            ),

            rankable_students AS (
                SELECT
                    student_enrollment_id,
                    student_id,
                    class_id,
                    academic_level_id,
                    applicable_subject_count,
                    entered_result_count,
                    total_score,

                    total_score
                        / NULLIF(
                            applicable_subject_count,
                            0
                        ) AS average_score

                FROM student_subject_summary

                WHERE applicable_subject_count > 0
                  AND entered_result_count =
                      applicable_subject_count
            ),

            ranked_students AS (
                SELECT
                    rs.*,

                    RANK() OVER (
                        PARTITION BY rs.class_id
                        ORDER BY rs.average_score DESC
                    ) AS class_position,

                    RANK() OVER (
                        PARTITION BY rs.academic_level_id
                        ORDER BY rs.average_score DESC
                    ) AS academic_level_position

                FROM rankable_students rs
            )

            SELECT
                rs.student_enrollment_id,
                rs.student_id,

                st.first_name,
                st.middle_name,
                st.last_name,
                st.admission_no AS admission_number,

                rs.class_id,
                c.name AS class_name,

                sec.id AS section_id,
                sec.name AS section_name,

                al.id AS academic_level_id,
                al.name AS academic_level_name,

                str.id AS stream_id,
                str.name AS stream_name,

                sc.id AS subject_combination_id,
                sc.name AS subject_combination_name,

                rs.applicable_subject_count,
                rs.entered_result_count,
                rs.total_score,
                ROUND(
                    rs.average_score,
                    2
                ) AS average_score,

                rs.class_position,
                rs.academic_level_position

            FROM ranked_students rs

            INNER JOIN students st
                ON st.id = rs.student_id

            INNER JOIN classes c
                ON c.id = rs.class_id

            INNER JOIN sections sec
                ON sec.id = (
                    SELECT se_inner.section_id
                    FROM student_enrollments se_inner
                    WHERE se_inner.id =
                        rs.student_enrollment_id
                )

            INNER JOIN academic_levels al
                ON al.id = rs.academic_level_id

            LEFT JOIN student_enrollments se
                ON se.id = rs.student_enrollment_id

            LEFT JOIN streams str
                ON str.id = se.stream_id

            LEFT JOIN subject_combinations sc
                ON sc.id = se.subject_combination_id

            WHERE rs.class_id = $5

            ORDER BY
                rs.class_position,
                st.last_name,
                st.first_name;
            `,
            [
                schoolId,
                context.academic_session_id,
                context.academic_level_id,
                termId,
                classId,
            ]
        );

        return res.status(200).json({
            rankings: rankingResult.rows,
            context: {
                termId: context.term_id,
                termName: context.term_name,
                classId: context.class_id,
                className: context.class_name,
                academicLevelId:
                    context.academic_level_id,
                academicLevelName:
                    context.academic_level_name,
            },
        });
    } catch (error) {
        console.error(
            "Failed to calculate result rankings:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to calculate result rankings.",
        });
    }
};



export const getSessionResultRankings = async (req, res) => {
    try {
        const { schoolId } = req;
        const { termId, classId } = req.query;

        if (!termId || !classId) {
            return res.status(400).json({
                message:
                    "Third-term and class are required.",
            });
        }

        const contextResult = await pool.query(
            `
            SELECT
                selected_term.id AS third_term_id,
                selected_term.name AS third_term_name,
                selected_term.academic_session_id,

                c.id AS class_id,
                c.name AS class_name,
                c.academic_level_id,

                al.name AS academic_level_name

            FROM terms selected_term

            INNER JOIN classes c
                ON c.id = $3
               AND c.academic_session_id =
                   selected_term.academic_session_id
               AND c.school_id = selected_term.school_id

            INNER JOIN academic_levels al
                ON al.id = c.academic_level_id

            WHERE selected_term.id = $1
              AND selected_term.school_id = $2
              AND selected_term.display_order = 3
              AND c.id = $3;
            `,
            [
                termId,
                schoolId,
                classId,
            ]
        );

        if (contextResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "The selected third term and class could not be found for this school.",
            });
        }

        const context = contextResult.rows[0];

        const rankingResult = await pool.query(
            `
            WITH session_terms AS (
                SELECT
                    id,
                    display_order
                FROM terms
                WHERE school_id = $1
                  AND academic_session_id = $2
                  AND display_order IN (1, 2, 3)
            ),

            applicable_subjects AS (
                SELECT
                    se.id AS student_enrollment_id,
                    s.id AS subject_id

                FROM student_enrollments se

                INNER JOIN classes c
                    ON c.id = se.class_id

                INNER JOIN subjects s
                    ON s.school_id = se.school_id

                INNER JOIN subject_academic_levels sal
                    ON sal.subject_id = s.id
                   AND sal.academic_level_id =
                       c.academic_level_id

                LEFT JOIN subject_combination_subjects scs
                    ON scs.subject_id = s.id
                   AND scs.subject_combination_id =
                       se.subject_combination_id

                WHERE se.school_id = $1
                  AND se.academic_session_id = $2
                  AND c.academic_level_id =
                      $3

                  AND (
                      se.subject_combination_id IS NULL
                      OR scs.subject_id IS NOT NULL
                  )
            ),

            student_term_summary AS (
                SELECT
                    se.id AS student_enrollment_id,
                    se.student_id,
                    se.class_id,
                    c.academic_level_id,

                    st.display_order,

                    COUNT(DISTINCT aps.subject_id)
                        AS applicable_subject_count,

                    COUNT(DISTINCT r.subject_id)
                        AS entered_result_count,

                    SUM(r.total) AS total_score

                FROM student_enrollments se

                INNER JOIN classes c
                    ON c.id = se.class_id

                CROSS JOIN session_terms st

                INNER JOIN applicable_subjects aps
                    ON aps.student_enrollment_id = se.id

                LEFT JOIN results r
                    ON r.student_enrollment_id = se.id
                   AND r.term_id = st.id
                   AND r.subject_id = aps.subject_id
                   AND r.school_id = $1

                WHERE se.school_id = $1
                  AND se.academic_session_id = $2
                  AND c.academic_level_id = $3

                GROUP BY
                    se.id,
                    se.student_id,
                    se.class_id,
                    c.academic_level_id,
                    st.display_order
            ),

            rankable_term_results AS (
                SELECT
                    student_enrollment_id,
                    student_id,
                    class_id,
                    academic_level_id,
                    display_order,

                    applicable_subject_count,
                    entered_result_count,

                    total_score
                        / NULLIF(
                            applicable_subject_count,
                            0
                        ) AS term_average

                FROM student_term_summary

                WHERE applicable_subject_count > 0
                  AND entered_result_count =
                      applicable_subject_count
            ),

            complete_session_results AS (
                SELECT
                    student_enrollment_id,
                    student_id,
                    class_id,
                    academic_level_id,

                    MAX(
                        CASE
                            WHEN display_order = 1
                            THEN term_average
                        END
                    ) AS first_term_average,

                    MAX(
                        CASE
                            WHEN display_order = 2
                            THEN term_average
                        END
                    ) AS second_term_average,

                    MAX(
                        CASE
                            WHEN display_order = 3
                            THEN term_average
                        END
                    ) AS third_term_average

                FROM rankable_term_results

                GROUP BY
                    student_enrollment_id,
                    student_id,
                    class_id,
                    academic_level_id

                HAVING COUNT(DISTINCT display_order) = 3
            ),

            session_rankable_students AS (
                SELECT
                    csr.*,

                    (
                        csr.first_term_average
                        + csr.second_term_average
                        + csr.third_term_average
                    ) / 3 AS session_average

                FROM complete_session_results csr
            ),

            ranked_students AS (
                SELECT
                    srs.*,

                    RANK() OVER (
                        PARTITION BY
                            srs.academic_level_id
                        ORDER BY
                            srs.session_average DESC
                    ) AS session_academic_level_position

                FROM session_rankable_students srs
            )

            SELECT
                rs.student_enrollment_id,
                rs.student_id,

                st.first_name,
                st.middle_name,
                st.last_name,
                st.admission_no AS admission_number,

                rs.class_id,
                c.name AS class_name,

                sec.id AS section_id,
                sec.name AS section_name,

                al.id AS academic_level_id,
                al.name AS academic_level_name,

                str.id AS stream_id,
                str.name AS stream_name,

                sc.id AS subject_combination_id,
                sc.name AS subject_combination_name,

                ROUND(
                    rs.first_term_average,
                    2
                ) AS first_term_average,

                ROUND(
                    rs.second_term_average,
                    2
                ) AS second_term_average,

                ROUND(
                    rs.third_term_average,
                    2
                ) AS third_term_average,

                ROUND(
                    rs.session_average,
                    2
                ) AS session_average,

                rs.session_academic_level_position

            FROM ranked_students rs

            INNER JOIN students st
                ON st.id = rs.student_id

            INNER JOIN classes c
                ON c.id = rs.class_id

            INNER JOIN sections sec
                ON sec.id = (
                    SELECT se_inner.section_id
                    FROM student_enrollments se_inner
                    WHERE se_inner.id =
                        rs.student_enrollment_id
                )

            INNER JOIN academic_levels al
                ON al.id = rs.academic_level_id

            LEFT JOIN student_enrollments se
                ON se.id = rs.student_enrollment_id

            LEFT JOIN streams str
                ON str.id = se.stream_id

            LEFT JOIN subject_combinations sc
                ON sc.id = se.subject_combination_id

            WHERE rs.class_id = $4

            ORDER BY
                rs.session_academic_level_position,
                st.last_name,
                st.first_name;
            `,
            [
                schoolId,
                context.academic_session_id,
                context.academic_level_id,
                classId,
            ]
        );

        return res.status(200).json({
            rankings: rankingResult.rows,
            context: {
                thirdTermId:
                    context.third_term_id,
                thirdTermName:
                    context.third_term_name,
                classId:
                    context.class_id,
                className:
                    context.class_name,
                academicLevelId:
                    context.academic_level_id,
                academicLevelName:
                    context.academic_level_name,
            },
        });
    } catch (error) {
        console.error(
            "Failed to calculate session result rankings:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to calculate session result rankings.",
        });
    }
};
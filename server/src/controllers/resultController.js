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
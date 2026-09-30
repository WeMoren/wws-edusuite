import pool from "../config/db.js";

export const createResultDocument = async (req, res) => {
    const {
        studentEnrollmentId,
        termId,
    } = req.body;

    if (!studentEnrollmentId || !termId) {
        return res.status(400).json({
            message:
                "Student enrollment ID and term ID are required.",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /*
         * Lock the enrollment so its academic context
         * cannot change while the document snapshot
         * is being created.
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

                st.first_name,
                st.middle_name,
                st.last_name,
                st.admission_no,
                st.gender,

                c.name AS class_name,
                al.name AS academic_level_name,

                s.name AS section_name,

                str.name AS stream_name,

                sc.name AS subject_combination_name,

                a_s.name AS academic_session_name

            FROM student_enrollments se

            INNER JOIN students st
                ON st.id = se.student_id

            INNER JOIN classes c
                ON c.id = se.class_id

            INNER JOIN academic_levels al
                ON al.id = c.academic_level_id

            INNER JOIN sections s
                ON s.id = se.section_id

            INNER JOIN academic_sessions a_s
                ON a_s.id = se.academic_session_id

            LEFT JOIN streams str
                ON str.id = se.stream_id

            LEFT JOIN subject_combinations sc
                ON sc.id = se.subject_combination_id

            WHERE se.id = $1
              AND se.school_id = $2

            FOR UPDATE OF se;
            `,
            [
                studentEnrollmentId,
                req.schoolId,
            ]
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
         * The term must belong to the same school
         * and academic session as the enrollment.
         */
        const termResult = await client.query(
            `
            SELECT
                t.id,
                t.name,
                t.academic_session_id

            FROM terms t

            INNER JOIN academic_sessions a_s
                ON a_s.id = t.academic_session_id

            WHERE t.id = $1
              AND a_s.school_id = $2;
            `,
            [
                termId,
                req.schoolId,
            ]
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
         * A school must have a Principal and Exam Officer
         * configured before a result document can be created.
         *
         * Their current details are snapshotted into the
         * document. Digital signatures and stamps remain
         * optional.
         */
        const officialsResult = await client.query(
            `
            SELECT
                official_type,
                name,
                title,
                signature_url,
                stamp_url

            FROM school_officials

            WHERE school_id = $1
              AND official_type IN (
                  'principal',
                  'exam_officer'
              );
            `,
            [req.schoolId]
        );

        const officials = {};

        for (const official of officialsResult.rows) {
            officials[official.official_type] = official;
        }

        if (!officials.principal) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "A Principal must be configured in School Officials before a result document can be created.",
            });
        }

        if (!officials.exam_officer) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "An Exam Officer must be configured in School Officials before a result document can be created.",
            });
        }

        /*
         * Create the document as a draft.
         * The unique database constraint prevents
         * more than one document for the same
         * enrollment and term.
         */
        const schoolResult = await client.query(
            `
            SELECT
                name,
                email,
                phone,
                address,
                logo_url
            FROM schools
            WHERE id = $1;
            `,
            [req.schoolId]
        );

        if (schoolResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "School not found.",
            });
        }

        const school = schoolResult.rows[0];

        const studentName = [
            enrollment.first_name,
            enrollment.middle_name,
            enrollment.last_name,
        ]
            .filter(Boolean)
            .join(" ");

        const result = await client.query(
            `
            INSERT INTO result_documents (
                school_id,
                student_enrollment_id,
                term_id,
                status,

                school_name,
                school_email,
                school_phone,
                school_address,
                school_logo_url,

                student_name,
                admission_number,
                gender,

                academic_session_name,
                term_name,
                academic_level_name,
                class_name,

                stream_name,
                subject_combination_name,

                principal_name,
                principal_title,
                principal_signature_url,
                principal_stamp_url,

                exam_officer_name,
                exam_officer_title,
                exam_officer_signature_url,
                exam_officer_stamp_url
            )
            VALUES (
                $1, $2, $3, 'draft',

                $4, $5, $6, $7, $8,

                $9, $10, $11,

                $12, $13, $14, $15,

                $16, $17,

                $18, $19, $20, $21,

                $22, $23, $24, $25
            )
            RETURNING *;
            `,
            [
                req.schoolId,
                enrollment.id,
                term.id,

                school.name,
                school.email,
                school.phone,
                school.address,
                school.logo_url,

                studentName,
                enrollment.admission_no,
                enrollment.gender,

                enrollment.academic_session_name,
                term.name,
                enrollment.academic_level_name,
                enrollment.class_name,

                enrollment.stream_name,
                enrollment.subject_combination_name,

                officials.principal.name,
                officials.principal.title,
                officials.principal.signature_url,
                officials.principal.stamp_url,

                officials.exam_officer.name,
                officials.exam_officer.title,
                officials.exam_officer.signature_url,
                officials.exam_officer.stamp_url,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message:
                "Result document draft created successfully.",
            document: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A result document already exists for this student and term.",
            });
        }

        console.error(
            "Failed to create result document:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to create result document.",
        });
    } finally {
        client.release();
    }
};




export const getResultDocumentById = async (req, res) => {
    const { id } = req.params;
    const { schoolId } = req;

    try {
        const documentResult = await pool.query(
            `
            SELECT
                rd.id,
                rd.school_id,
                rd.student_enrollment_id,
                rd.term_id,
                rd.status,

                rd.school_name,
                rd.school_email,
                rd.school_phone,
                rd.school_address,
                rd.school_logo_url,

                rd.student_name,
                rd.admission_number,
                rd.gender,

                rd.academic_session_name,
                rd.term_name,
                rd.academic_level_name,
                rd.class_name,
                rd.stream_name,
                rd.subject_combination_name,

                rd.principal_name,
                rd.principal_title,
                rd.principal_signature_url,
                rd.principal_stamp_url,

                rd.exam_officer_name,
                rd.exam_officer_title,
                rd.exam_officer_signature_url,
                rd.exam_officer_stamp_url,

                rd.finalized_at,
                rd.created_at,
                rd.updated_at

            FROM result_documents rd

            WHERE rd.id = $1
              AND rd.school_id = $2;
            `,
            [id, schoolId]
        );

        if (documentResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Result document not found.",
            });
        }

        const document = documentResult.rows[0];

        const resultsResult = await pool.query(
            `
            SELECT
                r.id,
                r.subject_id,
                s.name AS subject_name,
                s.code AS subject_code,
                r.ca,
                r.exam,
                r.total,
                r.grade,
                r.remark

            FROM results r

            INNER JOIN subjects s
                ON s.id = r.subject_id

            WHERE r.school_id = $1
              AND r.student_enrollment_id = $2
              AND r.term_id = $3

            ORDER BY
                s.name;
            `,
            [
                schoolId,
                document.student_enrollment_id,
                document.term_id,
            ]
        );

        return res.status(200).json({
            document,
            results: resultsResult.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch result document:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to fetch result document.",
        });
    }
};



export const finalizeResultDocument = async (req, res) => {
    const { id } = req.params;
    const { schoolId } = req;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /*
         * Lock the result document so two requests
         * cannot finalize it at the same time.
         */
        const documentResult = await client.query(
            `
            SELECT
                id,
                student_enrollment_id,
                term_id,
                status

            FROM result_documents

            WHERE id = $1
              AND school_id = $2

            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (documentResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Result document not found.",
            });
        }

        const document = documentResult.rows[0];

        if (document.status === "finalized") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "Result document is already finalized.",
            });
        }

        /*
         * A result document cannot be finalized without
         * at least one result record.
         */
        const resultsCount = await client.query(
            `
            SELECT COUNT(*)::INTEGER AS count

            FROM results

            WHERE school_id = $1
              AND student_enrollment_id = $2
              AND term_id = $3;
            `,
            [
                schoolId,
                document.student_enrollment_id,
                document.term_id,
            ]
        );

        if (resultsCount.rows[0].count === 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "Result document cannot be finalized because no results have been entered.",
            });
        }

        /*
         * Finalization permanently changes the document
         * from draft to finalized.
         *
         * The existing result update/delete handlers
         * already prevent changes to results belonging
         * to a finalized result document.
         */
        const finalizedResult = await client.query(
            `
            UPDATE result_documents

            SET
                status = 'finalized',
                finalized_at = NOW(),
                updated_at = NOW()

            WHERE id = $1
              AND school_id = $2

            RETURNING
                id,
                school_id,
                student_enrollment_id,
                term_id,
                status,
                finalized_at,
                updated_at;
            `,
            [id, schoolId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message:
                "Result document finalized successfully.",
            document: finalizedResult.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Failed to finalize result document:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to finalize result document.",
        });
    } finally {
        client.release();
    }
};
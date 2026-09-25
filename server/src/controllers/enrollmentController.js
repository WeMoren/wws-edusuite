import pool from "../config/db.js";

const validStatuses = [
    "active",
    "completed",
    "withdrawn",
    "transferred",
];

export const getEnrollments = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                se.id,
                se.school_id,
                se.student_id,
                se.academic_session_id,
                se.class_id,
                se.section_id,
                se.stream_id,
                se.subject_combination_id,
                se.status,
                se.enrolled_at,
                se.created_at,
                se.updated_at,

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                a.name AS academic_session_name,

                c.name AS class_name,

                sec.name AS section_name,
                st.name AS stream_name,
                sc.name AS subject_combination_name,
                c.academic_level_id

            FROM student_enrollments se

            JOIN students s
                ON s.id = se.student_id

            JOIN academic_sessions a
                ON a.id = se.academic_session_id

            JOIN classes c
                ON c.id = se.class_id

            JOIN sections sec
                ON sec.id = se.section_id

            LEFT JOIN streams st
                ON st.id = se.stream_id
                AND st.school_id = se.school_id

            LEFT JOIN subject_combinations sc
                ON sc.id = se.subject_combination_id
                AND sc.school_id = se.school_id

            WHERE se.school_id = $1

            ORDER BY se.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            enrollments: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch enrollments:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch enrollments.",
        });
    }
};

export const getEnrollmentById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                se.id,
                se.school_id,
                se.student_id,
                se.academic_session_id,
                se.class_id,
                se.section_id,
                se.stream_id,
                se.subject_combination_id,
                se.status,
                se.enrolled_at,
                se.created_at,
                se.updated_at,

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                a.name AS academic_session_name,

                c.name AS class_name,

                sec.name AS section_name,

                st.name AS stream_name,
                sc.name AS subject_combination_name,
                c.academic_level_id

            FROM student_enrollments se

            JOIN students s
                ON s.id = se.student_id

            JOIN academic_sessions a
                ON a.id = se.academic_session_id

            JOIN classes c
                ON c.id = se.class_id

            JOIN sections sec
                ON sec.id = se.section_id

            LEFT JOIN streams st
                 ON st.id = se.stream_id
                AND st.school_id = se.school_id

            LEFT JOIN subject_combinations sc
                ON sc.id = se.subject_combination_id
                AND sc.school_id = se.school_id


            WHERE se.id = $1
              AND se.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        return res.status(200).json({
            enrollment: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch enrollment:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch enrollment.",
        });
    }
};

export const createEnrollment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            studentId,
            academicSessionId,
            classId,
            sectionId,
            subjectCombinationId,
            streamId,
            status = "active",
            enrolledAt,
        } = req.body;

        if (
            !studentId ||
            !academicSessionId ||
            !classId ||
            !sectionId
        ) {
            return res.status(400).json({
                message:
                    "Student, academic session, class, and section are required.",
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid enrollment status.",
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
         * Validate academic session belongs to this school.
         */
        const sessionResult = await client.query(
            `
            SELECT id
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2;
            `,
            [academicSessionId, schoolId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic session not found.",
            });
        }

        /*
         * Validate class belongs to this school
         * and the selected academic session.
         */
        const classResult = await client.query(
            `
            SELECT id,
                academic_level_id
            FROM classes
            WHERE id = $1
              AND school_id = $2
              AND academic_session_id = $3;
            `,
            [classId, schoolId, academicSessionId]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Class not found for the selected academic session.",
            });
        }

        const academicLevelId =
             classResult.rows[0].academic_level_id;


        /*
 * Validate stream, if supplied.
 */
if (streamId) {
    const streamResult = await client.query(
        `
        SELECT st.id
        FROM streams st

        JOIN stream_academic_levels sal
            ON sal.stream_id = st.id
           AND sal.school_id = st.school_id

        WHERE st.id = $1
          AND st.school_id = $2
          AND st.is_active = TRUE
          AND sal.academic_level_id = $3
          AND sal.is_active = TRUE;
        `,
        [streamId, schoolId, academicLevelId]
    );

    if (streamResult.rows.length === 0) {
        return res.status(400).json({
            message:
                "The selected stream is not active or is not assigned to this academic level.",
        });
    }
}

/*
 * A subject combination must have a stream.
 */
if (subjectCombinationId && !streamId) {
    return res.status(400).json({
        message:
            "A stream is required when assigning a subject combination.",
    });
}

/*
 * Validate subject combination, if supplied.
 */
if (subjectCombinationId) {
    const combinationResult = await client.query(
        `
        SELECT sc.id
        FROM subject_combinations sc

        JOIN streams st
            ON st.id = sc.stream_id
           AND st.school_id = sc.school_id

        JOIN stream_academic_levels sal
            ON sal.stream_id = st.id
           AND sal.school_id = st.school_id

        WHERE sc.id = $1
          AND sc.school_id = $2
          AND sc.academic_level_id = $3
          AND sc.stream_id = $4
          AND sc.is_active = TRUE
          AND st.is_active = TRUE
          AND sal.academic_level_id = $3
          AND sal.is_active = TRUE

          AND EXISTS (
              SELECT 1
              FROM subject_combination_subjects scs
              WHERE scs.subject_combination_id = sc.id
                AND scs.school_id = sc.school_id
          )

          AND NOT EXISTS (
              SELECT 1
              FROM subject_combination_subjects scs

              WHERE scs.subject_combination_id = sc.id
                AND scs.school_id = sc.school_id

                AND NOT EXISTS (
                    SELECT 1
                    FROM subject_academic_levels sal_subject

                    WHERE sal_subject.subject_id = scs.subject_id
                      AND sal_subject.school_id = scs.school_id
                      AND sal_subject.academic_level_id = $3
                )
          );
        `,
        [
            subjectCombinationId,
            schoolId,
            academicLevelId,
            streamId,
        ]
    );

    if (combinationResult.rows.length === 0) {
        return res.status(400).json({
            message:
                "The selected subject combination is invalid, inactive, or does not belong to this stream and academic level.",
        });
    }
}


        /*
         * Validate section belongs to this school
         * and the selected class.
         */
        const sectionResult = await client.query(
            `
            SELECT id
            FROM sections
            WHERE id = $1
              AND school_id = $2
              AND class_id = $3;
            `,
            [sectionId, schoolId, classId]
        );

        if (sectionResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Section not found for the selected class.",
            });
        }

        /*
         * Check whether this student already has
         * an enrollment for this academic session.
         */
        const existingEnrollmentResult =
            await client.query(
                `
                SELECT id
                FROM student_enrollments
                WHERE student_id = $1
                  AND academic_session_id = $2;
                `,
                [studentId, academicSessionId]
            );

        if (existingEnrollmentResult.rows.length > 0) {
            return res.status(409).json({
                message:
                    "Student is already enrolled for this academic session.",
            });
        }

        const result = await client.query(
            `
            INSERT INTO student_enrollments (
                school_id,
                student_id,
                academic_session_id,
                class_id,
                section_id,
                stream_id,
                subject_combination_id,
                status,
                enrolled_at
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
                COALESCE($9, NOW())
            )
            RETURNING
                id,
                school_id,
                student_id,
                academic_session_id,
                class_id,
                section_id,
                stream_id,
                subject_combination_id,
                status,
                enrolled_at,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                studentId,
                academicSessionId,
                classId,
                sectionId,
                streamId,
                subjectCombinationId,
                status,
                enrolledAt || null,
            ]
        );

        return res.status(201).json({
            message: "Student enrolled successfully.",
            enrollment: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "Student is already enrolled for this academic session.",
            });
        }

        console.error(
            "Failed to create enrollment:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create enrollment.",
        });
    } finally {
        client.release();
    }
};

export const updateEnrollment = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            academicSessionId,
            classId,
            sectionId,
            streamId,
            subjectCombinationId,
            status,
            enrolledAt,
        } = req.body;

        if (
            status !== undefined &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid enrollment status.",
            });
        }

        const existingResult = await pool.query(
            `
            SELECT
                student_id,
                academic_session_id,
                class_id,
                section_id,
                stream_id,
                subject_combination_id,
                status,
                enrolled_at
            FROM student_enrollments
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextSessionId =
            academicSessionId ??
            existing.academic_session_id;

        const nextClassId =
            classId ??
            existing.class_id;

        const nextSectionId =
            sectionId ??
            existing.section_id;


        const nextStreamId =
            streamId !== undefined
            ? streamId
            : existing.stream_id;

         const nextSubjectCombinationId =
            subjectCombinationId !== undefined
                ? subjectCombinationId
            : existing.subject_combination_id;

        /*
         * Validate the selected session.
         */
        const sessionResult = await pool.query(
            `
            SELECT id
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2;
            `,
            [nextSessionId, schoolId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                message: "Academic session not found.",
            });
        }

        /*
         * Validate class against the selected session.
         */
        const classResult = await pool.query(
            `
            SELECT id, academic_level_id
            FROM classes
            WHERE id = $1
              AND school_id = $2
              AND academic_session_id = $3;
            `,
            [nextClassId, schoolId, nextSessionId]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Class not found for the selected academic session.",
            });
        }

        const academicLevelId =
             classResult.rows[0].academic_level_id;


        /*
        * Validate stream, if supplied.
        */
        if (nextStreamId) {
            const streamResult = await pool.query(
                `
                SELECT st.id
                FROM streams st

                JOIN stream_academic_levels sal
                    ON sal.stream_id = st.id
                AND sal.school_id = st.school_id

                WHERE st.id = $1
                AND st.school_id = $2
                AND st.is_active = TRUE
                AND sal.academic_level_id = $3
                AND sal.is_active = TRUE;
                `,
                [nextStreamId, schoolId, academicLevelId]
            );

            if (streamResult.rows.length === 0) {
                return res.status(400).json({
                    message:
                        "The selected stream is not active or is not assigned to this academic level.",
                });
            }
        }

        /*
        * A subject combination must have a stream.
        */
        if (nextSubjectCombinationId && !nextStreamId) {
            return res.status(400).json({
                message:
                    "A stream is required when assigning a subject combination.",
            });
        }

        /*
        * Validate subject combination, if supplied.
        */
        if (nextSubjectCombinationId) {
            const combinationResult = await pool.query(
                `
                SELECT sc.id
                FROM subject_combinations sc

                JOIN streams st
                    ON st.id = sc.stream_id
                AND st.school_id = sc.school_id

                JOIN stream_academic_levels sal
                    ON sal.stream_id = st.id
                AND sal.school_id = st.school_id

                WHERE sc.id = $1
                AND sc.school_id = $2
                AND sc.academic_level_id = $3
                AND sc.stream_id = $4
                AND sc.is_active = TRUE
                AND st.is_active = TRUE
                AND sal.academic_level_id = $3
                AND sal.is_active = TRUE

                AND EXISTS (
                    SELECT 1
                    FROM subject_combination_subjects scs
                    WHERE scs.subject_combination_id = sc.id
                        AND scs.school_id = sc.school_id
                )

                AND NOT EXISTS (
                    SELECT 1
                    FROM subject_combination_subjects scs

                    WHERE scs.subject_combination_id = sc.id
                        AND scs.school_id = sc.school_id

                        AND NOT EXISTS (
                            SELECT 1
                            FROM subject_academic_levels sal_subject

                            WHERE sal_subject.subject_id = scs.subject_id
                            AND sal_subject.school_id = scs.school_id
                            AND sal_subject.academic_level_id = $3
                        )
                );
                `,
                [
                    nextSubjectCombinationId,
                    schoolId,
                    academicLevelId,
                    nextStreamId,
                ]
            );

            if (combinationResult.rows.length === 0) {
                return res.status(400).json({
                    message:
                        "The selected subject combination is invalid, inactive, or does not belong to this stream and academic level.",
                });
            }
        }


        /*
         * Validate section against the selected class.
         */
        const sectionResult = await pool.query(
            `
            SELECT id
            FROM sections
            WHERE id = $1
              AND school_id = $2
              AND class_id = $3;
            `,
            [nextSectionId, schoolId, nextClassId]
        );

        if (sectionResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Section not found for the selected class.",
            });
        }

        /*
         * Prevent the student from having another
         * enrollment in the same academic session.
         */
        const duplicateResult = await pool.query(
            `
            SELECT id
            FROM student_enrollments
            WHERE student_id = $1
              AND academic_session_id = $2
              AND id <> $3;
            `,
            [
                existing.student_id,
                nextSessionId,
                id,
            ]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                message:
                    "Student is already enrolled for this academic session.",
            });
        }

        const result = await pool.query(
            `
            UPDATE student_enrollments
            SET
                academic_session_id = $1,
                class_id = $2,
                section_id = $3,
                stream_id = $4,
                subject_combination_id = $5,
                status = $6,
                enrolled_at = $7,
                updated_at = NOW()
            WHERE id = $8
              AND school_id = $9
            RETURNING
                id,
                school_id,
                student_id,
                academic_session_id,
                class_id,
                section_id,
                stream_id,
                subject_combination_id,
                status,
                enrolled_at,
                created_at,
                updated_at;
            `,
           [
                nextSessionId,
                nextClassId,
                nextSectionId,
                nextStreamId,
                nextSubjectCombinationId,
                status ?? existing.status,
                enrolledAt ??
                    existing.enrolled_at,
                id,
                schoolId,
            ]
        );

        return res.status(200).json({
            message: "Enrollment updated successfully.",
            enrollment: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "Student is already enrolled for this academic session.",
            });
        }

        console.error(
            "Failed to update enrollment:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update enrollment.",
        });
    }
};

export const deleteEnrollment = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM student_enrollments
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        return res.status(200).json({
            message: "Enrollment deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Failed to delete enrollment:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete enrollment.",
        });
    }
};
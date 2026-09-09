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

                sec.name AS section_name

            FROM student_enrollments se

            JOIN students s
                ON s.id = se.student_id

            JOIN academic_sessions a
                ON a.id = se.academic_session_id

            JOIN classes c
                ON c.id = se.class_id

            JOIN sections sec
                ON sec.id = se.section_id

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

                sec.name AS section_name

            FROM student_enrollments se

            JOIN students s
                ON s.id = se.student_id

            JOIN academic_sessions a
                ON a.id = se.academic_session_id

            JOIN classes c
                ON c.id = se.class_id

            JOIN sections sec
                ON sec.id = se.section_id

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
            SELECT id
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
                COALESCE($7, NOW())
            )
            RETURNING
                id,
                school_id,
                student_id,
                academic_session_id,
                class_id,
                section_id,
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
            SELECT id
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
                status = $4,
                enrolled_at = $5,
                updated_at = NOW()
            WHERE id = $6
              AND school_id = $7
            RETURNING
                id,
                school_id,
                student_id,
                academic_session_id,
                class_id,
                section_id,
                status,
                enrolled_at,
                created_at,
                updated_at;
            `,
            [
                nextSessionId,
                nextClassId,
                nextSectionId,
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
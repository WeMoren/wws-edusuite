import pool from "../config/db.js";

const validStatuses = ["present", "absent"];

export const getAttendance = async (req, res) => {
    try {
        const { schoolId } = req;

        const {
            academicSessionId,
            academicTermId,
            classId,
            attendanceDate,
        } = req.query;

        const values = [schoolId];
        const conditions = ["ar.school_id = $1"];

        if (academicSessionId) {
            values.push(academicSessionId);

            conditions.push(
                `se.academic_session_id = $${values.length}`
            );
        }

        if (academicTermId) {
            values.push(academicTermId);

            conditions.push(
                `ar.academic_term_id = $${values.length}`
            );
        }

        if (classId) {
            values.push(classId);

            conditions.push(
                `se.class_id = $${values.length}`
            );
        }

        if (attendanceDate) {
            values.push(attendanceDate);

            conditions.push(
                `ar.attendance_date = $${values.length}`
            );
        }

        const result = await pool.query(
            `
            SELECT
                ar.id,
                ar.school_id,
                ar.enrollment_id,
                ar.academic_term_id,
                ar.attendance_date::text AS attendance_date,
                ar.status,
                ar.created_by,
                ar.created_at,
                ar.updated_at,

                se.student_id,
                se.academic_session_id,
                se.class_id,
                se.section_id,

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                a.name AS academic_session_name,

                t.name AS academic_term_name,

                c.name AS class_name,

                sec.name AS section_name

            FROM attendance_records ar

            JOIN student_enrollments se
                ON se.id = ar.enrollment_id

            JOIN students s
                ON s.id = se.student_id

            JOIN academic_sessions a
                ON a.id = se.academic_session_id

            JOIN terms t
                ON t.id = ar.academic_term_id

            JOIN classes c
                ON c.id = se.class_id

            JOIN sections sec
                ON sec.id = se.section_id

            WHERE ${conditions.join(" AND ")}

            ORDER BY
                ar.attendance_date DESC,
                s.last_name ASC,
                s.first_name ASC;
            `,
            values
        );

        return res.status(200).json({
            attendance: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch attendance:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch attendance.",
        });
    }
};

export const getAttendanceById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                ar.id,
                ar.school_id,
                ar.enrollment_id,
                ar.academic_term_id,
                ar.attendance_date::text AS attendance_date,
                ar.status,
                ar.created_by,
                ar.created_at,
                ar.updated_at,

                se.student_id,
                se.academic_session_id,
                se.class_id,
                se.section_id,

                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                a.name AS academic_session_name,

                t.name AS academic_term_name,

                c.name AS class_name,

                sec.name AS section_name

            FROM attendance_records ar

            JOIN student_enrollments se
                ON se.id = ar.enrollment_id

            JOIN students s
                ON s.id = se.student_id

            JOIN academic_sessions a
                ON a.id = se.academic_session_id

            JOIN terms t
                ON t.id = ar.academic_term_id

            JOIN classes c
                ON c.id = se.class_id

            JOIN sections sec
                ON sec.id = se.section_id

            WHERE ar.id = $1
              AND ar.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found.",
            });
        }

        return res.status(200).json({
            attendance: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch attendance record:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch attendance record.",
        });
    }
};

export const createAttendanceBatch = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { userId } = req.user;

        const {
            academicSessionId,
            academicTermId,
            classId,
            attendanceDate,
            records,
        } = req.body;

        if (
            !academicSessionId ||
            !academicTermId ||
            !classId ||
            !attendanceDate ||
            !Array.isArray(records) ||
            records.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Academic session, academic term, class, attendance date, and attendance records are required.",
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
         * Validate academic term belongs to this school
         * and the selected academic session.
         */
        const termResult = await client.query(
            `
            SELECT id
            FROM terms
            WHERE id = $1
              AND school_id = $2
              AND academic_session_id = $3;
            `,
            [
                academicTermId,
                schoolId,
                academicSessionId,
            ]
        );

        if (termResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Academic term not found for the selected academic session.",
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
            [
                classId,
                schoolId,
                academicSessionId,
            ]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Class not found for the selected academic session.",
            });
        }

        /*
         * Validate the attendance date.
         */
        const dateResult = await client.query(
            `
            SELECT $1::date AS attendance_date;
            `,
            [attendanceDate]
        );

        if (
            dateResult.rows.length === 0 ||
            !dateResult.rows[0].attendance_date
        ) {
            return res.status(400).json({
                message: "Invalid attendance date.",
            });
        }

        /*
         * Prevent duplicate enrollment IDs
         * within the same batch request.
         */
        const enrollmentIds = records.map(
            (record) => record.enrollmentId
        );

        if (
            enrollmentIds.some(
                (id) => !id
            )
        ) {
            return res.status(400).json({
                message:
                    "Every attendance record must include an enrollment ID.",
            });
        }

        if (
            new Set(enrollmentIds).size !==
            enrollmentIds.length
        ) {
            return res.status(400).json({
                message:
                    "An enrollment cannot appear more than once in the same attendance batch.",
            });
        }

        /*
         * Validate every attendance status.
         */
        for (const record of records) {
            if (!validStatuses.includes(record.status)) {
                return res.status(400).json({
                    message:
                        "Attendance status must be either present or absent.",
                });
            }
        }

        /*
         * Validate all submitted enrollments belong
         * to this school, selected session, and class.
         */
        const enrollmentResult = await client.query(
            `
            SELECT
                id,
                student_id,
                academic_session_id,
                class_id
            FROM student_enrollments
            WHERE school_id = $1
              AND academic_session_id = $2
              AND class_id = $3
              AND id = ANY($4::uuid[]);
            `,
            [
                schoolId,
                academicSessionId,
                classId,
                enrollmentIds,
            ]
        );

        if (
            enrollmentResult.rows.length !==
            enrollmentIds.length
        ) {
            return res.status(400).json({
                message:
                    "One or more enrollment records are invalid for the selected school, academic session, or class.",
            });
        }

        await client.query("BEGIN");

        const savedRecordIds = [];

        for (const record of records) {
            const result = await client.query(
                `
                INSERT INTO attendance_records (
                    school_id,
                    enrollment_id,
                    academic_term_id,
                    attendance_date,
                    status,
                    created_by
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )
                ON CONFLICT (
                    enrollment_id,
                    academic_term_id,
                    attendance_date
                )
                DO UPDATE SET
                    status = EXCLUDED.status,
                    updated_at = NOW()
                RETURNING
                    id,
                    school_id,
                    enrollment_id,
                    academic_term_id,
                    attendance_date,
                    status,
                    created_by,
                    created_at,
                    updated_at;
                `,
                [
                    schoolId,
                    record.enrollmentId,
                    academicTermId,
                    attendanceDate,
                    record.status,
                    userId,
                ]
            );

            savedRecordIds.push(result.rows[0].id);
        }


        const savedRecordsResult = await client.query(
    `
    SELECT
        ar.id,
        ar.school_id,
        ar.enrollment_id,
        ar.academic_term_id,
        ar.attendance_date::text AS attendance_date,
        ar.status,
        ar.created_by,
        ar.created_at,
        ar.updated_at
    FROM attendance_records ar
    WHERE ar.school_id = $1
      AND ar.id = ANY($2::uuid[])
    ORDER BY array_position($2::uuid[], ar.id);
    `,
    [schoolId, savedRecordIds]
);

const savedRecords = savedRecordsResult.rows;


        await client.query("COMMIT");

        return res.status(200).json({
            message:
                "Attendance saved successfully.",
            attendance: savedRecords,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Failed to save attendance:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to save attendance.",
        });
    } finally {
        client.release();
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Attendance status is required.",
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message:
                    "Attendance status must be either present or absent.",
            });
        }

        const result = await pool.query(
            `
            UPDATE attendance_records
            SET
                status = $1,
                updated_at = NOW()
            WHERE id = $2
              AND school_id = $3
            RETURNING
                id,
                school_id,
                enrollment_id,
                academic_term_id,
                attendance_date,
                status,
                created_by,
                created_at,
                updated_at;
            `,
            [
                status,
                id,
                schoolId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found.",
            });
        }

        return res.status(200).json({
            message:
                "Attendance updated successfully.",
            attendance: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to update attendance:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to update attendance.",
        });
    }
};

export const deleteAttendance = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM attendance_records
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found.",
            });
        }

        return res.status(200).json({
            message:
                "Attendance deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Failed to delete attendance:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to delete attendance.",
        });
    }
};
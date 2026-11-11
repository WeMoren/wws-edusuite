import pool from "../config/db.js";
import { recordActivity } from "../services/activityLogService.js";

const validGenders = [
    "Male",
    "Female",
];

const validStatuses = [
    "active",
    "inactive",
];

export const getTeachers = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                t.id,
                t.school_id,
                t.staff_id AS school_staff_id,
                s.staff_id,
                s.first_name,
                s.last_name,
                s.email,
                s.phone,
                s.gender,
                s.status,
                t.subject,
                t.created_at,
                t.updated_at
            FROM teachers t
            JOIN school_staff s
                ON s.id = t.staff_id
               AND s.school_id = t.school_id
            WHERE t.school_id = $1
            ORDER BY t.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            teachers: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch teachers:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch teachers.",
        });
    }
};

export const getTeacherById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                t.id,
                t.school_id,
                t.staff_id AS school_staff_id,
                s.staff_id,
                s.first_name,
                s.last_name,
                s.email,
                s.phone,
                s.gender,
                s.status,
                t.subject,
                t.created_at,
                t.updated_at
            FROM teachers t
            JOIN school_staff s
                ON s.id = t.staff_id
               AND s.school_id = t.school_id
            WHERE t.id = $1
              AND t.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found.",
            });
        }

        return res.status(200).json({
            teacher: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch teacher:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch teacher.",
        });
    }
};



export const createTeacher = async (req, res) => {
    const {
        staffId,
        firstName,
        lastName,
        email,
        phoneNum,
        subject,
        gender,
    } = req.body;

    const normalizedStaffId =
        typeof staffId === "string" ? staffId.trim() : "";

    const normalizedFirstName =
        typeof firstName === "string" ? firstName.trim() : "";

    const normalizedLastName =
        typeof lastName === "string" ? lastName.trim() : "";

    const normalizedSubject =
        typeof subject === "string" ? subject.trim() : "";

    const normalizedEmail =
        email === undefined || email === null || email.trim?.() === ""
            ? null
            : typeof email === "string"
                ? email.trim().toLowerCase()
                : false;

    const normalizedPhone =
        phoneNum === undefined || phoneNum === null
            ? null
            : typeof phoneNum === "string"
                ? phoneNum.trim() || null
                : false;

    if (
        !normalizedStaffId ||
        !normalizedFirstName ||
        !normalizedLastName ||
        !normalizedSubject
    ) {
        return res.status(400).json({
            message: "Staff ID, first name, last name and subject are required.",
        });
    }

    if (normalizedEmail === false) {
        return res.status(400).json({
            message: "Please provide a valid email address.",
        });
    }

    if (
        normalizedEmail &&
        (
            normalizedEmail.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        )
    ) {
        return res.status(400).json({
            message: "Please provide a valid email address.",
        });
    }

    if (
        normalizedPhone === false ||
        (normalizedPhone && normalizedPhone.length > 30)
    ) {
        return res.status(400).json({
            message: "Phone number must not exceed 30 characters.",
        });
    }

    if (
        gender !== undefined &&
        gender !== null &&
        gender !== "" &&
        !validGenders.includes(gender)
    ) {
        return res.status(400).json({
            message: "Invalid gender. Choose Male or Female.",
        });
    }

    const normalizedGender = gender || null;

    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        // Reuse an existing staff identity when the Staff ID already exists.
        const existingStaffResult = await client.query(
            `
                SELECT
                    id,
                    staff_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    gender,
                    status
                FROM school_staff
                WHERE school_id = $1
                  AND staff_id = $2
                FOR UPDATE
            `,
            [req.schoolId, normalizedStaffId]
        );

        let schoolStaffId;

        if (existingStaffResult.rows.length > 0) {
            schoolStaffId = existingStaffResult.rows[0].id;
        } else {
            // Create a staff identity without creating a login account.
            const newStaffResult = await client.query(
                `
                    INSERT INTO school_staff (
                        school_id,
                        staff_id,
                        first_name,
                        last_name,
                        gender,
                        email,
                        phone
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `,
                [
                    req.schoolId,
                    normalizedStaffId,
                    normalizedFirstName,
                    normalizedLastName,
                    normalizedGender,
                    normalizedEmail,
                    normalizedPhone,
                ]
            );

            schoolStaffId = newStaffResult.rows[0].id;
        }

        // A staff identity can have only one teacher profile per school.
        const existingTeacherResult = await client.query(
            `
                SELECT id
                FROM teachers
                WHERE school_id = $1
                  AND staff_id = $2
            `,
            [req.schoolId, schoolStaffId]
        );

        if (existingTeacherResult.rows.length > 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                message: "This staff member already has a teacher profile.",
            });
        }

        const newTeacherResult = await client.query(
            `
                INSERT INTO teachers (
                    school_id,
                    staff_id,
                    subject
                )
                VALUES ($1, $2, $3)
                RETURNING id
            `,
            [
                req.schoolId,
                schoolStaffId,
                normalizedSubject,
            ]
        );

        const teacherResult = await client.query(
            `
                SELECT
                    t.id,
                    t.school_id,
                    t.staff_id AS school_staff_id,
                    s.staff_id,
                    s.first_name,
                    s.last_name,
                    s.email,
                    s.phone,
                    s.gender,
                    s.status,
                    t.subject,
                    t.created_at,
                    t.updated_at
                FROM teachers t
                JOIN school_staff s
                    ON s.id = t.staff_id
                   AND s.school_id = t.school_id
                WHERE t.id = $1
                  AND t.school_id = $2
            `,
            [
                newTeacherResult.rows[0].id,
                req.schoolId,
            ]
        );

        const createdTeacher = teacherResult.rows[0];

        await recordActivity({
            schoolId: req.schoolId,
            userId: req.user.userId,
            action: "teacher_created",
            description: `Created teacher record for "${createdTeacher.first_name} ${createdTeacher.last_name}" (Staff ID: ${createdTeacher.staff_id}).`,
            client,
        });

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            message: "Teacher created successfully.",
            teacher: teacherResult.rows[0],
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        console.error("Create teacher error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A staff record with this Staff ID or email already exists.",
            });
        }

        return res.status(500).json({
            message: "Failed to create teacher.",
        });
    } finally {
        client.release();
    }
};

export const updateTeacher = async (req, res) => {
    const {
        staffId,
        firstName,
        lastName,
        email,
        phoneNum,
        subject,
        gender,
        status,
    } = req.body;

    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        // Fetch and lock the teacher profile and its shared staff identity.
        const existingResult = await client.query(
            `
                SELECT
                    t.id,
                    t.staff_id AS school_staff_id,
                    t.subject,
                    s.staff_id,
                    s.first_name,
                    s.last_name,
                    s.email,
                    s.phone,
                    s.gender,
                    s.status
                FROM teachers t
                JOIN school_staff s
                    ON s.id = t.staff_id
                   AND s.school_id = t.school_id
                WHERE t.id = $1
                  AND t.school_id = $2
                FOR UPDATE OF t, s
            `,
            [req.params.id, req.schoolId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                message: "Teacher not found.",
            });
        }

        const existingTeacher = existingResult.rows[0];

        // Preserve existing values when a field is omitted.
        const nextStaffId =
            staffId === undefined
                ? existingTeacher.staff_id
                : typeof staffId === "string"
                    ? staffId.trim()
                    : "";

        const nextFirstName =
            firstName === undefined
                ? existingTeacher.first_name
                : typeof firstName === "string"
                    ? firstName.trim()
                    : "";

        const nextLastName =
            lastName === undefined
                ? existingTeacher.last_name
                : typeof lastName === "string"
                    ? lastName.trim()
                    : "";

        const nextSubject =
            subject === undefined
                ? existingTeacher.subject
                : typeof subject === "string"
                    ? subject.trim()
                    : "";

        const nextEmail =
            email === undefined
                ? existingTeacher.email
                : email === null || email === ""
                    ? null
                    : typeof email === "string"
                        ? email.trim().toLowerCase() || null
                        : false;

        const nextPhone =
            phoneNum === undefined
                ? existingTeacher.phone
                : phoneNum === null
                    ? null
                    : typeof phoneNum === "string"
                        ? phoneNum.trim() || null
                        : false;

        const nextGender =
            gender === undefined
                ? existingTeacher.gender
                : gender === ""
                    ? null
                    : gender;

        const nextStatus =
            status === undefined
                ? existingTeacher.status
                : status;

        if (
            !nextStaffId ||
            !nextFirstName ||
            !nextLastName ||
            !nextSubject
        ) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message:
                    "Staff ID, first name, last name and subject are required.",
            });
        }

        if (
            nextEmail === false ||
            (
                nextEmail &&
                (
                    nextEmail.length > 255 ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)
                )
            )
        ) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message: "Please provide a valid email address.",
            });
        }

        if (
            nextPhone === false ||
            (nextPhone && nextPhone.length > 30)
        ) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message: "Phone number must not exceed 30 characters.",
            });
        }

        if (
            nextGender !== null &&
            !validGenders.includes(nextGender)
        ) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message: "Invalid gender. Choose Male or Female.",
            });
        }

        if (!validStatuses.includes(nextStatus)) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message: "Invalid status. Choose active or inactive.",
            });
        }

        // Update the shared staff identity.
        await client.query(
            `
                UPDATE school_staff
                SET
                    staff_id = $1,
                    first_name = $2,
                    last_name = $3,
                    email = $4,
                    phone = $5,
                    gender = $6,
                    status = $7,
                    updated_at = NOW()
                WHERE id = $8
                  AND school_id = $9
            `,
            [
                nextStaffId,
                nextFirstName,
                nextLastName,
                nextEmail,
                nextPhone,
                nextGender,
                nextStatus,
                existingTeacher.school_staff_id,
                req.schoolId,
            ]
        );

        // Update the teacher's teaching information.
        await client.query(
            `
                UPDATE teachers
                SET
                    subject = $1,
                    updated_at = NOW()
                WHERE id = $2
                  AND school_id = $3
            `,
            [
                nextSubject,
                req.params.id,
                req.schoolId,
            ]
        );

        // Return the updated teacher using the same shape as GET.
        const updatedResult = await client.query(
            `
                SELECT
                    t.id,
                    t.school_id,
                    t.staff_id AS school_staff_id,
                    s.staff_id,
                    s.first_name,
                    s.last_name,
                    s.email,
                    s.phone,
                    s.gender,
                    s.status,
                    t.subject,
                    t.created_at,
                    t.updated_at
                FROM teachers t
                JOIN school_staff s
                    ON s.id = t.staff_id
                   AND s.school_id = t.school_id
                WHERE t.id = $1
                  AND t.school_id = $2
            `,
            [req.params.id, req.schoolId]
        );


       const updatedTeacher = updatedResult.rows[0];

        await recordActivity({
            schoolId: req.schoolId,
            userId: req.user.userId,
            action: "teacher_updated",
            description: `Updated teacher record for "${updatedTeacher.first_name} ${updatedTeacher.last_name}" (Staff ID: ${updatedTeacher.staff_id}).`,
            client,
        });

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(200).json({
            message: "Teacher updated successfully.",
            teacher: updatedTeacher,
        });

    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        console.error("Update teacher error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A staff record with this Staff ID or email already exists.",
            });
        }

        return res.status(500).json({
            message: "Failed to update teacher.",
        });
    } finally {
        client.release();
    }
};



export const deleteTeacher = async (req, res) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const { schoolId } = req;
        const { id } = req.params;

        await client.query("BEGIN");
        transactionStarted = true;

        const teacherResult = await client.query(
            `
            SELECT
                t.id,
                s.first_name,
                s.last_name,
                s.staff_id
            FROM teachers t
            JOIN school_staff s
                ON s.id = t.staff_id
               AND s.school_id = t.school_id
            WHERE t.id = $1
              AND t.school_id = $2
            FOR UPDATE OF t;
            `,
            [id, schoolId]
        );

        if (teacherResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                message: "Teacher not found.",
            });
        }

        const teacher = teacherResult.rows[0];

        await client.query(
            `
            DELETE FROM teachers
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        await recordActivity({
            schoolId,
            userId: req.user.userId,
            action: "teacher_deleted",
            description: `Deleted teacher record for "${teacher.first_name} ${teacher.last_name}" (Staff ID: ${teacher.staff_id}).`,
            client,
        });

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(200).json({
            message: "Teacher deleted successfully.",
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        console.error(
            "Failed to delete teacher:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete teacher.",
        });
    } finally {
        client.release();
    }
};
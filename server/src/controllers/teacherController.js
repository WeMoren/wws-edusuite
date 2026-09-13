import pool from "../config/db.js";
import { hashPassword } from "../utils/password.js";

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
                t.user_id,
                t.staff_id,
                u.first_name,
                u.last_name,
                u.email,
                u.status,
                t.subject,
                t.gender,
                t.created_at,
                t.updated_at

            FROM teachers t

            JOIN users u
                ON u.id = t.user_id

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
                t.user_id,
                t.staff_id,
                u.first_name,
                u.last_name,
                u.email,
                u.status,
                t.subject,
                t.gender,
                t.created_at,
                t.updated_at

            FROM teachers t

            JOIN users u
                ON u.id = t.user_id

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
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            staffId,
            firstName,
            lastName,
            email,
            password,
            subject,
            gender,
        } = req.body;

        if (
            !staffId ||
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !subject ||
            !gender
        ) {
            return res.status(400).json({
                message: "All teacher fields are required.",
            });
        }

        if (!validGenders.includes(gender)) {
            return res.status(400).json({
                message: "Invalid teacher gender.",
            });
        }

        await client.query("BEGIN");

        /*
         * Check whether the Staff ID already exists
         * within this school.
         */
        const staffIdResult = await client.query(
            `
            SELECT id
            FROM teachers
            WHERE school_id = $1
              AND staff_id = $2;
            `,
            [schoolId, staffId]
        );

        if (staffIdResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Staff ID already exists.",
            });
        }

        /*
         * Check whether the email already exists
         * within this school.
         */
        const emailResult = await client.query(
            `
            SELECT id
            FROM users
            WHERE school_id = $1
              AND email = $2;
            `,
            [schoolId, email]
        );

        if (emailResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Email already exists.",
            });
        }

        const passwordHash = await hashPassword(password);

        /*
         * Create the user account.
         */
        const userResult = await client.query(
            `
            INSERT INTO users (
                school_id,
                first_name,
                last_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                school_id,
                first_name,
                last_name,
                email,
                status,
                created_at;
            `,
            [
                schoolId,
                firstName,
                lastName,
                email,
                passwordHash,
            ]
        );

        const user = userResult.rows[0];

        /*
         * Find the existing Teacher role.
         */
        const roleResult = await client.query(
            `
            SELECT id
            FROM roles
            WHERE name = 'Teacher';
            `
        );

        if (roleResult.rows.length === 0) {
            throw new Error("Teacher role not found.");
        }

        const teacherRoleId = roleResult.rows[0].id;

        /*
         * Assign Teacher role to the user.
         */
        await client.query(
            `
            INSERT INTO user_roles (
                user_id,
                role_id
            )
            VALUES ($1, $2);
            `,
            [user.id, teacherRoleId]
        );

        /*
         * Create the teacher profile.
         */
        const teacherResult = await client.query(
            `
            INSERT INTO teachers (
                school_id,
                user_id,
                staff_id,
                subject,
                gender
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                school_id,
                user_id,
                staff_id,
                subject,
                gender,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                user.id,
                staffId,
                subject,
                gender,
            ]
        );

        const teacher = teacherResult.rows[0];

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Teacher created successfully.",
            teacher: {
                ...teacher,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "Teacher, Staff ID, or email already exists.",
            });
        }

        console.error(
            "Failed to create teacher:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create teacher.",
        });
    } finally {
        client.release();
    }
};

export const updateTeacher = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            staffId,
            firstName,
            lastName,
            email,
            password,
            subject,
            gender,
            status,
        } = req.body;

        if (
            gender !== undefined &&
            !validGenders.includes(gender)
        ) {
            return res.status(400).json({
                message: "Invalid teacher gender.",
            });
        }

        if (
            status !== undefined &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid teacher status.",
            });
        }

        const existingResult = await client.query(
            `
            SELECT
                t.user_id,
                t.staff_id,
                t.subject,
                t.gender,
                u.first_name,
                u.last_name,
                u.email,
                u.status
            FROM teachers t
            JOIN users u
                ON u.id = t.user_id
            WHERE t.id = $1
              AND t.school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found.",
            });
        }

        const existing = existingResult.rows[0];

        const nextStaffId =
            staffId ?? existing.staff_id;

        const nextFirstName =
            firstName ?? existing.first_name;

        const nextLastName =
            lastName ?? existing.last_name;

        const nextEmail =
            email ?? existing.email;

        const nextSubject =
            subject ?? existing.subject;

        const nextGender =
            gender ?? existing.gender;

        const nextStatus =
            status ?? existing.status;

        /*
         * Check Staff ID uniqueness within this school.
         */
        const staffIdResult = await client.query(
            `
            SELECT id
            FROM teachers
            WHERE school_id = $1
              AND staff_id = $2
              AND id <> $3;
            `,
            [
                schoolId,
                nextStaffId,
                id,
            ]
        );

        if (staffIdResult.rows.length > 0) {
            return res.status(409).json({
                message: "Staff ID already exists.",
            });
        }

        /*
         * Check email uniqueness within this school.
         */
        const emailResult = await client.query(
            `
            SELECT id
            FROM users
            WHERE school_id = $1
              AND email = $2
              AND id <> $3;
            `,
            [
                schoolId,
                nextEmail,
                existing.user_id,
            ]
        );

        if (emailResult.rows.length > 0) {
            return res.status(409).json({
                message: "Email already exists.",
            });
        }

        await client.query("BEGIN");

        /*
         * Update user account information.
         */
        if (password !== undefined) {
            const passwordHash =
                await hashPassword(password);

            await client.query(
                `
                UPDATE users
                SET
                    first_name = $1,
                    last_name = $2,
                    email = $3,
                    password_hash = $4,
                    status = $5,
                    updated_at = NOW()
                WHERE id = $6
                  AND school_id = $7;
                `,
                [
                    nextFirstName,
                    nextLastName,
                    nextEmail,
                    passwordHash,
                    nextStatus,
                    existing.user_id,
                    schoolId,
                ]
            );
        } else {
            await client.query(
                `
                UPDATE users
                SET
                    first_name = $1,
                    last_name = $2,
                    email = $3,
                    status = $4,
                    updated_at = NOW()
                WHERE id = $5
                  AND school_id = $6;
                `,
                [
                    nextFirstName,
                    nextLastName,
                    nextEmail,
                    nextStatus,
                    existing.user_id,
                    schoolId,
                ]
            );
        }

        /*
         * Update teacher-specific information.
         */
        const teacherResult = await client.query(
            `
            UPDATE teachers
            SET
                staff_id = $1,
                subject = $2,
                gender = $3,
                updated_at = NOW()
            WHERE id = $4
              AND school_id = $5
            RETURNING
                id,
                school_id,
                user_id,
                staff_id,
                subject,
                gender,
                created_at,
                updated_at;
            `,
            [
                nextStaffId,
                nextSubject,
                nextGender,
                id,
                schoolId,
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Teacher updated successfully.",
            teacher: {
                ...teacherResult.rows[0],
                firstName: nextFirstName,
                lastName: nextLastName,
                email: nextEmail,
                status: nextStatus,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "Teacher, Staff ID, or email already exists.",
            });
        }

        console.error(
            "Failed to update teacher:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update teacher.",
        });
    } finally {
        client.release();
    }
};

export const deleteTeacher = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        const teacherResult = await client.query(
            `
            SELECT user_id
            FROM teachers
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found.",
            });
        }

        const userId = teacherResult.rows[0].user_id;

        await client.query("BEGIN");

        /*
         * Deleting the user cascades to:
         * - user_roles
         * - teacher profile
         *
         * Sections reference users with ON DELETE SET NULL,
         * so an assigned class teacher is safely unassigned.
         */
        await client.query(
            `
            DELETE FROM users
            WHERE id = $1
              AND school_id = $2;
            `,
            [userId, schoolId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Teacher deleted successfully.",
        });
    } catch (error) {
        await client.query("ROLLBACK");

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
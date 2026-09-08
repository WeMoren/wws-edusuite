import pool from "../config/db.js";

export const getStudents = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                id,
                school_id,
                admission_no,
                first_name,
                middle_name,
                last_name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                status,
                created_at,
                updated_at
            FROM students
            WHERE school_id = $1
            ORDER BY created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            students: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch students:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch students.",
        });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                id,
                school_id,
                admission_no,
                first_name,
                middle_name,
                last_name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                status,
                created_at,
                updated_at
            FROM students
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        return res.status(200).json({
            student: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch student:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch student.",
        });
    }
};

export const createStudent = async (req, res) => {
    try {
        const { schoolId } = req;

        const {
            admissionNo,
            firstName,
            middleName = null,
            lastName,
            gender = null,
            dateOfBirth = null,
            phone = null,
            email = null,
            address = null,
            status = "active",
        } = req.body;

        if (!admissionNo || !firstName || !lastName) {
            return res.status(400).json({
                message:
                    "Admission number, first name, and last name are required.",
            });
        }

        const validStatuses = [
            "active",
            "inactive",
            "graduated",
            "transferred",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid student status.",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO students (
                school_id,
                admission_no,
                first_name,
                middle_name,
                last_name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                status
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
                $9,
                $10,
                $11
            )
            RETURNING
                id,
                school_id,
                admission_no,
                first_name,
                middle_name,
                last_name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                status,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                admissionNo,
                firstName,
                middleName,
                lastName,
                gender,
                dateOfBirth,
                phone,
                email,
                address,
                status,
            ]
        );

        return res.status(201).json({
            message: "Student created successfully.",
            student: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A student with this admission number already exists in this school.",
            });
        }

        console.error(
            "Failed to create student:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create student.",
        });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            admissionNo,
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            status,
        } = req.body;

        const validStatuses = [
            "active",
            "inactive",
            "graduated",
            "transferred",
        ];

        if (
            status !== undefined &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid student status.",
            });
        }

        const existingStudentResult = await pool.query(
            `
            SELECT
                admission_no,
                first_name,
                middle_name,
                last_name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                status
            FROM students
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        if (existingStudentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        const existingStudent =
            existingStudentResult.rows[0];

        const result = await pool.query(
            `
            UPDATE students
            SET
                admission_no = $1,
                first_name = $2,
                middle_name = $3,
                last_name = $4,
                gender = $5,
                date_of_birth = $6,
                phone = $7,
                email = $8,
                address = $9,
                status = $10,
                updated_at = NOW()
            WHERE id = $11
              AND school_id = $12
            RETURNING
                id,
                school_id,
                admission_no,
                first_name,
                middle_name,
                last_name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                status,
                created_at,
                updated_at;
            `,
            [
                admissionNo ?? existingStudent.admission_no,
                firstName ?? existingStudent.first_name,
                middleName !== undefined
                    ? middleName
                    : existingStudent.middle_name,
                lastName ?? existingStudent.last_name,
                gender !== undefined
                    ? gender
                    : existingStudent.gender,
                dateOfBirth !== undefined
                    ? dateOfBirth
                    : existingStudent.date_of_birth,
                phone !== undefined
                    ? phone
                    : existingStudent.phone,
                email !== undefined
                    ? email
                    : existingStudent.email,
                address !== undefined
                    ? address
                    : existingStudent.address,
                status ?? existingStudent.status,
                id,
                schoolId,
            ]
        );

        return res.status(200).json({
            message: "Student updated successfully.",
            student: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "A student with this admission number already exists in this school.",
            });
        }

        console.error(
            "Failed to update student:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update student.",
        });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM students
            WHERE id = $1
              AND school_id = $2
            RETURNING id;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        return res.status(200).json({
            message: "Student deleted successfully.",
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Student cannot be deleted because related records exist.",
            });
        }

        console.error(
            "Failed to delete student:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to delete student.",
        });
    }
};
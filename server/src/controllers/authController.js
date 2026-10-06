
import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "../utils/password.js";

const generateSchoolSlug = (schoolName) => {
    return schoolName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const registerUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            roleId,
        } = req.body;

        const { schoolId } = req;

        if (
            !schoolId ||
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !roleId
        ) {
            return res.status(400).json({
                message: "All fields are required.",
            });
        }

        const passwordHash = await hashPassword(password);

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

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
                RETURNING id, school_id, first_name, last_name, email, status, created_at;
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

            await client.query(
                `
                INSERT INTO user_roles (
                    user_id,
                    role_id
                )
                VALUES ($1, $2);
                `,
                [user.id, roleId]
            );

            await client.query("COMMIT");

            return res.status(201).json({
                message: "User registered successfully.",
                user,
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("User registration failed:", error.message);

        return res.status(500).json({
            message: "User registration failed.",
        });
    }
};

export const registerSchool = async (req, res) => {
    const {
        schoolName,
        schoolEmail,
        schoolPhone,
        schoolAddress,
        firstName,
        lastName,
        email,
        password,
    } = req.body;

    if (
        !schoolName ||
        !schoolEmail ||
        !schoolPhone ||
        !schoolAddress ||
        !firstName ||
        !lastName ||
        !email ||
        !password
    ) {
        return res.status(400).json({
            message: "All required fields must be provided.",
        });
    }

    const slug = generateSchoolSlug(schoolName);

    if (!slug) {
        return res.status(400).json({
            message: "A valid school name is required.",
        });
    }

    const client = await pool.connect();

    try {
        const passwordHash = await hashPassword(password);

        await client.query("BEGIN");

        const schoolResult = await client.query(
            `
            INSERT INTO schools (
                name,
                slug,
                email,
                phone,
                address
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                name,
                slug,
                email,
                phone,
                address,
                status,
                created_at;
            `,
            [
                schoolName,
                slug,
                schoolEmail,
                schoolPhone,
                schoolAddress,
            ]
        );

        const school = schoolResult.rows[0];

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
                school.id,
                firstName,
                lastName,
                email,
                passwordHash,
            ]
        );

        const user = userResult.rows[0];

        const roleResult = await client.query(
            `
            SELECT id
            FROM roles
            WHERE name = 'Admin';
            `
        );

        if (roleResult.rows.length === 0) {
            throw new Error("Admin role not found.");
        }

        const adminRoleId = roleResult.rows[0].id;

        await client.query(
            `
            INSERT INTO user_roles (
                user_id,
                role_id
            )
            VALUES ($1, $2);
            `,
            [user.id, adminRoleId]
        );

        await client.query(
            `
            INSERT INTO assessment_settings (
                school_id
            )
            VALUES ($1);
            `,
            [school.id]
        );

        await client.query(
            `
            INSERT INTO grading_scales (
                school_id,
                min_score,
                max_score,
                grade,
                remark
            )
            VALUES
                ($1, 90, 100, 'A1', 'Excellent'),
                ($1, 80, 89, 'B2', 'Very Good'),
                ($1, 70, 79, 'B3', 'Good'),
                ($1, 60, 69, 'C4', 'Credit'),
                ($1, 50, 59, 'C5', 'Credit'),
                ($1, 45, 49, 'D7', 'Pass'),
                ($1, 40, 44, 'E8', 'Pass'),
                ($1, 0, 39, 'F9', 'Fail');
            `,
            [school.id]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "School registered successfully.",
            school,
            user,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            if (error.constraint === "schools_email_key") {
                return res.status(409).json({
                    message: "A school with this email already exists.",
                });
            }

            if (error.constraint === "schools_slug_key") {
                return res.status(409).json({
                    message: "A school with this name already exists.",
                });
            }

            if (error.constraint === "unique_user_email_per_school") {
                return res.status(409).json({
                    message:
                        "An account with this administrator email already exists for this school.",
                });
            }
        }

        console.error("School registration failed:", error.message);

        return res.status(500).json({
            message: "School registration failed.",
        });
    } finally {
        client.release();
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }

        const userResult = await pool.query(
            `
            SELECT
                u.id,
                u.school_id,
                u.first_name,
                u.last_name,
                u.email,
                u.password_hash,
                u.status,
                r.id AS role_id,
                r.name AS role
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.email = $1;
            `,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const user = userResult.rows[0];

        if (user.status !== "active") {
            return res.status(403).json({
                message: "User account is inactive.",
            });
        }

        const passwordValid = await verifyPassword(
            password,
            user.password_hash
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                schoolId: user.school_id,
                roleId: user.role_id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                schoolId: user.school_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                roleId: user.role_id,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("User login failed:", error.message);

        return res.status(500).json({
            message: "Login failed.",
        });
    }
};


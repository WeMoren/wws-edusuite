import pool from "../config/db.js";
import { hashPassword } from "../utils/password.js";

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
    const client = await pool.connect();

    try {
        const {
            schoolName,
            slug,
            schoolEmail,
            schoolPhone,
            firstName,
            lastName,
            email,
            password,
        } = req.body;

        if (
            !schoolName ||
            !slug ||
            !schoolEmail ||
            !firstName ||
            !lastName ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message: "All required fields must be provided.",
            });
        }

        const passwordHash = await hashPassword(password);

        await client.query("BEGIN");

        const schoolResult = await client.query(
            `
            INSERT INTO schools (
                name,
                slug,
                email,
                phone
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, slug, email, phone, status, created_at;
            `,
            [schoolName, slug, schoolEmail, schoolPhone || null]
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
            RETURNING id, school_id, first_name, last_name, email, status, created_at;
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

        await client.query("COMMIT");

        return res.status(201).json({
            message: "School registered successfully.",
            school,
            user,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("School registration failed:", error.message);

        return res.status(500).json({
            message: "School registration failed.",
        });
    } finally {
        client.release();
    }
};



import jwt from "jsonwebtoken";
import { verifyPassword } from "../utils/password.js";

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

import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { randomUUID } from "crypto";


const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';

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
            password,
            roleId,
        } = req.body;

        const email = normalizeEmail(req.body.email ?? "");

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
        schoolPhone,
        schoolAddress,
        firstName,
        lastName,
        password,
    } = req.body;

    const schoolEmail = normalizeEmail(req.body.schoolEmail ?? "");
    const email = normalizeEmail(req.body.email ?? "");

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

        const userId = randomUUID();
        const schoolStaffId = randomUUID();
        const staffId = `STF-${userId.replace(/-/g, "").slice(0, 12)}`;

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

        const staffResult = await client.query(
            `
            INSERT INTO school_staff (
                id,
                school_id,
                staff_id,
                first_name,
                last_name
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                school_id,
                staff_id,
                first_name,
                last_name,
                gender,
                status,
                created_at;
            `,
            [
                schoolStaffId,
                school.id,
                staffId,
                firstName,
                lastName,
            ]
        );

        const staff = staffResult.rows[0];

        const userResult = await client.query(
            `
            INSERT INTO users (
                id,
                school_id,
                first_name,
                last_name,
                email,
                password_hash,
                school_staff_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                school_id,
                first_name,
                last_name,
                email,
                status,
                school_staff_id,
                created_at;
            `,
            [
                userId,
                school.id,
                firstName,
                lastName,
                email,
                passwordHash,
                schoolStaffId,
            ]
        );

        const user = userResult.rows[0];

        const roleResult = await client.query(
            `
            SELECT
                id,
                name
            FROM roles
            WHERE name = 'Principal';
            `
        );

        if (roleResult.rows.length !== 1) {
            throw new Error(
                "Required school Principal role was not found."
            );
        }

        for (const role of roleResult.rows) {
            await client.query(
                `
                INSERT INTO user_roles (
                    user_id,
                    role_id
                )
                VALUES ($1, $2);
                `,
                [user.id, role.id]
            );
        }

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

                // Create the school's initial subscription trial.
        // Trial duration and plan pricing are read from the database.
        const billingSettingsResult = await client.query(
            `
            SELECT
                trial_duration_days
            FROM platform_billing_settings
            WHERE singleton = TRUE;
            `
        );

        if (billingSettingsResult.rows.length !== 1) {
            throw new Error(
                "Platform billing settings are missing."
            );
        }

        const activePlansResult = await client.query(
            `
            SELECT
                id,
                billing_period,
                price_per_student,
                currency
            FROM subscription_plans
            WHERE is_active = TRUE;
            `
        );

        if (activePlansResult.rows.length !== 1) {
            throw new Error(
                "Exactly one active subscription plan is required."
            );
        }

        const billingSettings = billingSettingsResult.rows[0];
        const activePlan = activePlansResult.rows[0];

        await client.query(
            `
            INSERT INTO subscriptions (
                school_id,
                plan_id,
                status,
                billing_period,
                price_per_student,
                active_student_count,
                amount,
                currency,
                trial_start,
                trial_end
            )
            VALUES (
                $1,
                $2,
                'trial',
                $3,
                $4,
                0,
                0,
                $5,
                NOW(),
                NOW() + ($6 * INTERVAL '1 day')
            );
            `,
            [
                school.id,
                activePlan.id,
                activePlan.billing_period,
                activePlan.price_per_student,
                activePlan.currency,
                billingSettings.trial_duration_days,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "School registered successfully.",
            school,
            user: {
                id: user.id,
                schoolId: user.school_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                status: user.status,
                schoolStaffId: user.school_staff_id,
            },
            staff,
            roles: roleResult.rows,
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

            if (error.constraint === "unique_user_email") {
                return res.status(409).json({
                    message:
                        "An account with this email already exists.",
                });
            }

            if (error.constraint === "unique_staff_id_per_school") {
                return res.status(409).json({
                    message:
                        "A staff account with this identifier already exists.",
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
        const { password } = req.body;
        const email = normalizeEmail(req.body.email ?? "");

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
                u.token_version,
                r.id AS role_id,
                r.name AS role
            FROM users u
            JOIN user_roles ur
                ON ur.user_id = u.id
            JOIN roles r
                ON r.id = ur.role_id
            WHERE u.email = $1
            ORDER BY r.name;
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

        const roleIds = userResult.rows.map(
            (row) => row.role_id
        );

        const roles = userResult.rows.map(
            (row) => row.role
        );

        const token = jwt.sign(
            {
                userId: user.id,
                schoolId: user.school_id,
                tokenVersion: user.token_version,
                roleIds,
                roles,

                // Backward compatibility for existing middleware
                // and code that still expects one role.
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

                // Multi-role data
                roleIds,
                roles,

                // Backward compatibility
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
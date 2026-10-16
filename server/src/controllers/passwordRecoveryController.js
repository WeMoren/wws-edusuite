
import pool from "../config/db.js";
import { randomBytes, createHash } from "node:crypto";
import { hashPassword } from "../utils/password.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const MIN_PASSWORD_LENGTH = 12;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

const normalizeEmail = (email) =>
    typeof email === "string" ? email.trim().toLowerCase() : "";

const hashResetToken = (token) =>
    createHash("sha256").update(token).digest("hex");

const genericResetMessage =
    "If an account with that email exists, password-reset instructions will be sent.";

const isLocalResetDebugEnabled = () =>
    process.env.NODE_ENV !== "production" &&
    process.env.PASSWORD_RESET_DEBUG === "true";

export const requestPasswordReset = async (req, res) => {
    const email = normalizeEmail(req.body?.email);

    // Keep the public response the same for unknown and known emails.
    if (!email || email.length > 255) {
        return res.status(200).json({ message: genericResetMessage });
    }

    try {
        const userResult = await pool.query(
            `SELECT id, first_name, email
             FROM users
             WHERE email = $1
               AND status = 'active'
             LIMIT 1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(200).json({ message: genericResetMessage });
        }

        const user = userResult.rows[0];
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = hashResetToken(rawToken);

        // Revoke any previous reset link before issuing a new one.
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await client.query(
                `UPDATE password_reset_tokens
                 SET invalidated_at = NOW()
                 WHERE user_id = $1
                   AND used_at IS NULL
                   AND invalidated_at IS NULL`,
                [user.id]
            );

            await client.query(
                `INSERT INTO password_reset_tokens
                    (user_id, token_hash, expires_at)
                 VALUES
                    ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))`,
                [user.id, tokenHash, RESET_TOKEN_EXPIRY_MINUTES]
            );

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            throw new Error("FRONTEND_URL is not configured.");
        }

        const parsedFrontendUrl = new URL(frontendUrl);

        if (
            !["http:", "https:"].includes(parsedFrontendUrl.protocol) ||
            parsedFrontendUrl.username ||
            parsedFrontendUrl.password
        ) {
            throw new Error("FRONTEND_URL must be a valid HTTP(S) URL.");
        }

        const resetUrl = new URL("/reset-password", parsedFrontendUrl);
        resetUrl.searchParams.set("token", rawToken);

        if (isLocalResetDebugEnabled()) {
            // This is deliberately unavailable in production.
            // Keep local server logs private because the URL contains a secret.
            console.info(
                `[PASSWORD RESET — LOCAL DEVELOPMENT ONLY] ${resetUrl.href}`
            );
        } else {
            await sendPasswordResetEmail({
                to: user.email,
                recipientName: user.first_name,
                resetUrl: resetUrl.href,
                expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
            });
        }

        return res.status(200).json({ message: genericResetMessage });
    } catch (error) {
        // Do not expose account details, reset tokens, or mail-provider errors.
        console.error("Password-reset request failed:", error.message);

        return res.status(200).json({ message: genericResetMessage });
    }
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body ?? {};

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        return res.status(400).json({
            message: "This password-reset link is invalid or has expired.",
        });
    }

    if (
        typeof password !== "string" ||
        password.length < MIN_PASSWORD_LENGTH
    ) {
        return res.status(400).json({
            message: `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        });
    }

    if (password.length > 1024) {
        return res.status(400).json({
            message: "Your password is too long.",
        });
    }

    const tokenHash = hashResetToken(token);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock the token and user to prevent simultaneous token reuse.
        const tokenResult = await client.query(
            `SELECT
                prt.id AS reset_token_id,
                u.id AS user_id
             FROM password_reset_tokens prt
             JOIN users u ON u.id = prt.user_id
             WHERE prt.token_hash = $1
               AND prt.expires_at > NOW()
               AND prt.used_at IS NULL
               AND prt.invalidated_at IS NULL
               AND u.status = 'active'
             FOR UPDATE OF prt, u`,
            [tokenHash]
        );

        if (tokenResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This password-reset link is invalid or has expired.",
            });
        }

        const { reset_token_id: resetTokenId, user_id: userId } =
            tokenResult.rows[0];

        const passwordHash = await hashPassword(password);

        await client.query(
            `UPDATE users
             SET password_hash = $1,
                 token_version = token_version + 1,
                 updated_at = NOW()
             WHERE id = $2`,
            [passwordHash, userId]
        );

        await client.query(
            `UPDATE password_reset_tokens
             SET used_at = NOW()
             WHERE id = $1`,
            [resetTokenId]
        );

        await client.query(
            `UPDATE password_reset_tokens
             SET invalidated_at = NOW()
             WHERE user_id = $1
               AND id <> $2
               AND used_at IS NULL
               AND invalidated_at IS NULL`,
            [userId, resetTokenId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Your password has been reset successfully. Please sign in with your new password.",
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Password-reset rollback failed:",
                rollbackError.message
            );
        }

        console.error("Password reset failed:", error.message);

        return res.status(500).json({
            message: "We could not reset your password. Please try again.",
        });
    } finally {
        client.release();
    }
};

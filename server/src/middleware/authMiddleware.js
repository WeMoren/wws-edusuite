
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token required.",
        });
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({
            message: "Invalid or expired authentication token.",
        });
    }

    if (
        typeof decoded.userId !== "string" ||
        typeof decoded.schoolId !== "string" ||
        !Number.isInteger(decoded.tokenVersion)
    ) {
        return res.status(401).json({
            message: "Invalid or expired authentication token. Please sign in again.",
        });
    }

    try {
        const result = await pool.query(
            `SELECT token_version, status
             FROM users
             WHERE id = $1
               AND school_id = $2`,
            [decoded.userId, decoded.schoolId]
        );

        if (
            result.rows.length === 0 ||
            result.rows[0].status !== "active" ||
            result.rows[0].token_version !== decoded.tokenVersion
        ) {
            return res.status(401).json({
                message: "Your session is no longer valid. Please sign in again.",
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        console.error(
            "Authentication database check failed:",
            error.message
        );

        return res.status(500).json({
            message: "Unable to verify your session. Please try again.",
        });
    }
};

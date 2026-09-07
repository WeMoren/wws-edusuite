import pool from "../config/db.js";

export const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const { roleId } = req.user;

            if (!roleId) {
                return res.status(403).json({
                    message: "User role not found.",
                });
            }

            const result = await pool.query(
                `
                SELECT 1
                FROM role_permissions rp
                JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE rp.role_id = $1
                  AND p.resource = $2
                  AND p.action = $3;
                `,
                [roleId, resource, action]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({
                    message: "You do not have permission to perform this action.",
                });
            }

            next();
        } catch (error) {
            console.error("Permission check failed:", error.message);

            return res.status(500).json({
                message: "Permission check failed.",
            });
        }
    };
};
import pool from "../config/db.js";

export const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user || {};

            const roleIds = Array.isArray(user.roleIds)
                ? user.roleIds
                : user.roleId
                    ? [user.roleId]
                    : [];

            if (roleIds.length === 0) {
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
                WHERE rp.role_id = ANY($1::uuid[])
                  AND p.resource = $2
                  AND p.action = $3
                LIMIT 1;
                `,
                [roleIds, resource, action]
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
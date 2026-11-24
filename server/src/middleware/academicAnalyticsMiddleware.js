
import pool from "../config/db.js";

export const requireAcademicAnalyticsAccess = async (req, res, next) => {
    try {
        const user = req.user || {};

        const userRoles = Array.isArray(user.roles)
            ? user.roles
            : user.role
                ? [user.role]
                : [];

        // Principal retains the existing full-access bypass.
        if (userRoles.includes("Principal")) {
            return next();
        }

        // Check the dedicated database permission first.
        const roleIds = Array.isArray(user.roleIds)
            ? user.roleIds
            : user.roleId
                ? [user.roleId]
                : [];

        if (roleIds.length > 0) {
            const permissionResult = await pool.query(
                `
                SELECT 1
                FROM role_permissions rp
                JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE rp.role_id = ANY($1::uuid[])
                  AND p.resource = 'academicAnalytics'
                  AND p.action = 'view'
                LIMIT 1;
                `,
                [roleIds]
            );

            if (permissionResult.rows.length > 0) {
                return next();
            }
        }

        // Teacher login accounts qualify only when they currently
        // hold an active Head Teacher staff-position assignment.
        if (userRoles.includes("Teacher")) {
            const headTeacherResult = await pool.query(
                `
                SELECT 1
                FROM users u
                JOIN school_staff ss
                    ON ss.id = u.school_staff_id
                   AND ss.school_id = u.school_id
                JOIN staff_position_assignments spa
                    ON spa.staff_id = ss.id
                   AND spa.school_id = ss.school_id
                JOIN staff_positions sp
                    ON sp.id = spa.position_id
                WHERE u.id = $1
                  AND u.school_id = $2
                  AND ss.status = 'active'
                  AND spa.status = 'active'
                  AND spa.ended_at IS NULL
                  AND sp.code = 'head_teacher'
                LIMIT 1;
                `,
                [user.userId, req.schoolId]
            );

            if (headTeacherResult.rows.length > 0) {
                return next();
            }
        }

        return res.status(403).json({
            message: "You do not have permission to view academic analytics."
        });
    } catch (error) {
        console.error(
            "Academic analytics permission check failed:",
            error.message
        );

        return res.status(500).json({
            message: "Academic analytics permission check failed."
        });
    }
};

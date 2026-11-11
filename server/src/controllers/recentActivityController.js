import pool from "../config/db.js";

// GET recent activities for the authenticated school.
export const getRecentActivities = async (req, res) => {
    const schoolId = req.schoolId;

    try {
        const result = await pool.query(
            `
            SELECT
                ra.id,
                ra.action,
                ra.description AS activity,
                ra.created_at AS "createdAt",
                ra.user_id,
                CASE
                    WHEN u.id IS NOT NULL
                    THEN CONCAT_WS(' ', u.first_name, u.last_name)
                    ELSE 'Former user'
                END AS performed_by
            FROM recent_activities ra
            LEFT JOIN users u
                ON u.id = ra.user_id
               AND u.school_id = ra.school_id
            WHERE ra.school_id = $1
            ORDER BY ra.created_at DESC
            LIMIT 50;
            `,
            [schoolId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get recent activities error:", error);

        return res.status(500).json({
            message: "Failed to fetch recent activities.",
        });
    }
};

import pool from "../config/db.js";

export const recordActivity = async ({
    schoolId,
    userId,
    action,
    description,
    client = pool,
}) => {
    if (!schoolId || !action || !description) {
        throw new Error(
            "School ID, activity action, and description are required."
        );
    }

    const result = await client.query(
        `
        INSERT INTO recent_activities (
            school_id,
            user_id,
            action,
            description
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, school_id, user_id, action, description, created_at;
        `,
        [schoolId, userId || null, action, description]
    );

    return result.rows[0];
};

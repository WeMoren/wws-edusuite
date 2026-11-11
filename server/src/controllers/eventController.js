
import pool from "../config/db.js";
import { recordActivity } from "../services/activityLogService.js";

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === value
    );
};

// Run related database operations as one transaction.
const withTransaction = async (callback) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");

        return result;
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Transaction rollback error:", rollbackError);
        }

        throw error;
    } finally {
        client.release();
    }
};

// GET all school events.
export const getEvents = async (req, res) => {
    const schoolId = req.schoolId;

    try {
        const result = await pool.query(
            `
            SELECT
                id,
                title,
                event_date::text AS date,
                created_by,
                created_at,
                updated_at
            FROM school_events
            WHERE school_id = $1
            ORDER BY event_date ASC, created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get events error:", error);

        return res.status(500).json({
            message: "Failed to fetch school events.",
        });
    }
};

// CREATE an event.
export const createEvent = async (req, res) => {
    const schoolId = req.schoolId;
    const userId = req.user.userId;
    const { title, date } = req.body;

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            message: "Event title is required.",
        });
    }

    if (title.trim().length > 200) {
        return res.status(400).json({
            message: "Event title cannot exceed 200 characters.",
        });
    }

    if (!isValidDate(date)) {
        return res.status(400).json({
            message: "A valid event date is required in YYYY-MM-DD format.",
        });
    }

    try {
        const event = await withTransaction(async (client) => {
            const result = await client.query(
                `
                INSERT INTO school_events (
                    school_id,
                    title,
                    event_date,
                    created_by
                )
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    event_date::text AS date,
                    created_by,
                    created_at,
                    updated_at;
                `,
                [schoolId, title.trim(), date, userId]
            );

            const createdEvent = result.rows[0];

            await recordActivity({
                schoolId,
                userId,
                action: "event_created",
                description: `Created event "${createdEvent.title}".`,
                client,
            });

            return createdEvent;
        });

        return res.status(201).json({
            message: "Event created successfully.",
            event,
        });
    } catch (error) {
        console.error("Create event error:", error);

        return res.status(500).json({
            message: "Failed to create event.",
        });
    }
};

// UPDATE an event.
export const updateEvent = async (req, res) => {
    const schoolId = req.schoolId;
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, date } = req.body;

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            message: "Event title is required.",
        });
    }

    if (title.trim().length > 200) {
        return res.status(400).json({
            message: "Event title cannot exceed 200 characters.",
        });
    }

    if (!isValidDate(date)) {
        return res.status(400).json({
            message: "A valid event date is required in YYYY-MM-DD format.",
        });
    }

    try {
        const event = await withTransaction(async (client) => {
            const result = await client.query(
                `
                UPDATE school_events
                SET
                    title = $1,
                    event_date = $2,
                    updated_at = NOW()
                WHERE id = $3
                  AND school_id = $4
                RETURNING
                    id,
                    title,
                    event_date::text AS date,
                    created_by,
                    created_at,
                    updated_at;
                `,
                [title.trim(), date, id, schoolId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const updatedEvent = result.rows[0];

            await recordActivity({
                schoolId,
                userId,
                action: "event_updated",
                description: `Updated event "${updatedEvent.title}".`,
                client,
            });

            return updatedEvent;
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found.",
            });
        }

        return res.status(200).json({
            message: "Event updated successfully.",
            event,
        });
    } catch (error) {
        console.error("Update event error:", error);

        return res.status(500).json({
            message: "Failed to update event.",
        });
    }
};

// DELETE an event.
export const deleteEvent = async (req, res) => {
    const schoolId = req.schoolId;
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        const deletedEvent = await withTransaction(async (client) => {
            const result = await client.query(
                `
                DELETE FROM school_events
                WHERE id = $1
                  AND school_id = $2
                RETURNING id, title;
                `,
                [id, schoolId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const event = result.rows[0];

            await recordActivity({
                schoolId,
                userId,
                action: "event_deleted",
                description: `Deleted event "${event.title}".`,
                client,
            });

            return event;
        });

        if (!deletedEvent) {
            return res.status(404).json({
                message: "Event not found.",
            });
        }

        return res.status(200).json({
            message: "Event deleted successfully.",
        });
    } catch (error) {
        console.error("Delete event error:", error);

        return res.status(500).json({
            message: "Failed to delete event.",
        });
    }
};

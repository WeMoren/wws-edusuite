import pool from "../config/db.js";
import { getAcademicPerformanceAnalytics } from "../services/academicAnalyticsService.js";

const isValidUuid = (value) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const getAcademicPerformance = async (req, res) => {
    const { academicSessionId, termId } = req.query;

    try {
        if (
            academicSessionId !== undefined &&
            !isValidUuid(academicSessionId)
        ) {
            return res.status(400).json({
                message: "A valid academic session ID is required.",
            });
        }

        if (termId !== undefined && !isValidUuid(termId)) {
            return res.status(400).json({
                message: "A valid term ID is required.",
            });
        }

        if (termId !== undefined && academicSessionId === undefined) {
            return res.status(400).json({
                message: "An academic session is required when selecting a term.",
            });
        }

        const analytics = await getAcademicPerformanceAnalytics({
            schoolId: req.schoolId,
            academicSessionId: academicSessionId || null,
            termId: termId || null,
        });

        if (!analytics) {
            return res.status(404).json({
                message: "The selected academic period could not be found.",
            });
        }

        return res.status(200).json(analytics);
    } catch (error) {
        console.error(
            "Get academic performance analytics error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch academic performance analytics.",
        });
    }
};


export const getAcademicAnalyticsPeriods = async (req, res) => {
    try {
        const { schoolId } = req;

        const [sessionsResult, termsResult] = await Promise.all([
            pool.query(
                `
                SELECT
                    id,
                    name,
                    start_date,
                    end_date,
                    is_current
                FROM academic_sessions
                WHERE school_id = $1
                ORDER BY start_date DESC;
                `,
                [schoolId]
            ),

            pool.query(
                `
                SELECT
                    t.id,
                    t.academic_session_id,
                    t.name,
                    t.display_order,
                    t.start_date,
                    t.end_date,
                    t.is_current,
                    a.name AS academic_session_name
                FROM terms t
                JOIN academic_sessions a
                    ON a.id = t.academic_session_id
                   AND a.school_id = t.school_id
                WHERE t.school_id = $1
                ORDER BY
                    a.start_date DESC,
                    t.display_order ASC;
                `,
                [schoolId]
            ),
        ]);

        return res.status(200).json({
            sessions: sessionsResult.rows,
            terms: termsResult.rows,
        });
    } catch (error) {
        console.error(
            "Get academic analytics periods error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch academic analytics periods.",
        });
    }
};
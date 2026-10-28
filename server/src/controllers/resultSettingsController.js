import pool from "../config/db.js";

const isValidRange = (min, max) =>
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min >= 0 &&
    max <= 100 &&
    min <= max;

const mapGrade = (row) => ({
    id: row.id,
    min: Number(row.min_score),
    max: Number(row.max_score),
    grade: row.grade,
    remark: row.remark,
});

export const getResultSettings = async (req, res) => {
    try {
        const { schoolId } = req;

        const [assessmentResult, gradingResult] = await Promise.all([
            pool.query(
                `SELECT ca_max, exam_max
                 FROM assessment_settings
                 WHERE school_id = $1;`,
                [schoolId]
            ),
            pool.query(
                `SELECT id, min_score, max_score, grade, remark
                 FROM grading_scales
                 WHERE school_id = $1
                 ORDER BY min_score DESC, max_score DESC;`,
                [schoolId]
            ),
        ]);

        if (assessmentResult.rows.length === 0) {
            return res.status(409).json({
                message: "Assessment settings have not been configured for this school.",
            });
        }

        return res.status(200).json({
            assessmentSettings: {
                caMax: Number(assessmentResult.rows[0].ca_max),
                examMax: Number(assessmentResult.rows[0].exam_max),
            },
            gradingScale: gradingResult.rows.map(mapGrade),
        });
    } catch (error) {
        console.error("Failed to fetch result settings:", error.message);

        return res.status(500).json({
            message: "Failed to fetch result settings.",
        });
    }
};

export const updateAssessmentSettings = async (req, res) => {
    try {
        const { schoolId } = req;
        const caMax = Number(req.body.caMax);
        const examMax = Number(req.body.examMax);

        if (
            req.body.caMax === "" ||
            req.body.examMax === "" ||
            !Number.isFinite(caMax) ||
            !Number.isFinite(examMax) ||
            caMax < 0 ||
            caMax > 100 ||
            examMax < 0 ||
            examMax > 100 ||
            caMax + examMax !== 100
        ) {
            return res.status(400).json({
                message: "CAT and Exam marks must be valid numbers between 0 and 100 and total exactly 100.",
            });
        }

        const result = await pool.query(
            `UPDATE assessment_settings
             SET ca_max = $1,
                 exam_max = $2,
                 updated_at = NOW()
             WHERE school_id = $3
             RETURNING ca_max, exam_max;`,
            [caMax, examMax, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Assessment settings were not found for this school.",
            });
        }

        return res.status(200).json({
            message: "Assessment settings saved successfully.",
            assessmentSettings: {
                caMax: Number(result.rows[0].ca_max),
                examMax: Number(result.rows[0].exam_max),
            },
        });
    } catch (error) {
        console.error("Failed to update assessment settings:", error.message);

        return res.status(500).json({
            message: "Failed to update assessment settings.",
        });
    }
};

export const createGradingRule = async (req, res) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const { schoolId } = req;
        const min = Number(req.body.min);
        const max = Number(req.body.max);
        const grade = typeof req.body.grade === "string" ? req.body.grade.trim() : "";
        const remark = typeof req.body.remark === "string" ? req.body.remark.trim() : "";

        if (!isValidRange(min, max) || !grade || !remark) {
            return res.status(400).json({
                message: "Provide a valid score range between 0 and 100, a grade, and a remark.",
            });
        }

        await client.query("BEGIN");
        transactionStarted = true;

        const settingsLock = await client.query(
            `SELECT id
             FROM assessment_settings
             WHERE school_id = $1
             FOR UPDATE;`,
            [schoolId]
        );

        if (settingsLock.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                message: "Assessment settings have not been configured for this school.",
            });
        }

        const overlap = await client.query(
            `SELECT 1
             FROM grading_scales
             WHERE school_id = $1
               AND min_score <= $2
               AND max_score >= $3
             LIMIT 1;`,
            [schoolId, max, min]
        );

        if (overlap.rows.length > 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                message: "This score range overlaps an existing grading range.",
            });
        }

        const result = await client.query(
            `INSERT INTO grading_scales (
                school_id, min_score, max_score, grade, remark
             )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, min_score, max_score, grade, remark;`,
            [schoolId, min, max, grade, remark]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            message: "Grading rule created successfully.",
            gradingRule: mapGrade(result.rows[0]),
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        console.error("Failed to create grading rule:", error.message);

        return res.status(500).json({
            message: "Failed to create grading rule.",
        });
    } finally {
        client.release();
    }
};

export const updateGradingRule = async (req, res) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const { schoolId } = req;
        const { id } = req.params;
        const min = Number(req.body.min);
        const max = Number(req.body.max);
        const grade = typeof req.body.grade === "string" ? req.body.grade.trim() : "";
        const remark = typeof req.body.remark === "string" ? req.body.remark.trim() : "";

        if (!isValidRange(min, max) || !grade || !remark) {
            return res.status(400).json({
                message: "Provide a valid score range between 0 and 100, a grade, and a remark.",
            });
        }

        await client.query("BEGIN");
        transactionStarted = true;

        const settingsLock = await client.query(
            `SELECT id
             FROM assessment_settings
             WHERE school_id = $1
             FOR UPDATE;`,
            [schoolId]
        );

        if (settingsLock.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                message: "Assessment settings have not been configured for this school.",
            });
        }

        const overlap = await client.query(
            `SELECT 1
             FROM grading_scales
             WHERE school_id = $1
               AND id <> $2
               AND min_score <= $3
               AND max_score >= $4
             LIMIT 1;`,
            [schoolId, id, max, min]
        );

        if (overlap.rows.length > 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                message: "This score range overlaps an existing grading range.",
            });
        }

        const result = await client.query(
            `UPDATE grading_scales
             SET min_score = $1,
                 max_score = $2,
                 grade = $3,
                 remark = $4,
                 updated_at = NOW()
             WHERE id = $5
               AND school_id = $6
             RETURNING id, min_score, max_score, grade, remark;`,
            [min, max, grade, remark, id, schoolId]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                message: "Grading rule not found.",
            });
        }

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(200).json({
            message: "Grading rule updated successfully.",
            gradingRule: mapGrade(result.rows[0]),
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        console.error("Failed to update grading rule:", error.message);

        return res.status(500).json({
            message: "Failed to update grading rule.",
        });
    } finally {
        client.release();
    }
};

export const deleteGradingRule = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM grading_scales
             WHERE id = $1
               AND school_id = $2
             RETURNING id;`,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Grading rule not found.",
            });
        }

        return res.status(200).json({
            message: "Grading rule deleted successfully.",
        });
    } catch (error) {
        console.error("Failed to delete grading rule:", error.message);

        return res.status(500).json({
            message: "Failed to delete grading rule.",
        });
    }
};

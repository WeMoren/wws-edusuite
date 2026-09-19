import pool from "../config/db.js";

const getSchoolOfficials = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                official_type,
                name,
                title,
                signature_url,
                stamp_url,
                created_at,
                updated_at
            FROM school_officials
            WHERE school_id = $1
            ORDER BY
                CASE official_type
                    WHEN 'principal' THEN 1
                    WHEN 'exam_officer' THEN 2
                    WHEN 'accounting_officer' THEN 3
                END
            `,
            [req.schoolId]
        );

        return res.status(200).json({
            officials: result.rows
        });
    } catch (error) {
        console.error("Get school officials error:", error);

        return res.status(500).json({
            message: "Failed to retrieve school officials."
        });
    }
};

const getSchoolOfficial = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT
                id,
                official_type,
                name,
                title,
                signature_url,
                stamp_url,
                created_at,
                updated_at
            FROM school_officials
            WHERE id = $1
              AND school_id = $2
            `,
            [id, req.schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "School official not found."
            });
        }

        return res.status(200).json({
            official: result.rows[0]
        });
    } catch (error) {
        console.error("Get school official error:", error);

        return res.status(500).json({
            message: "Failed to retrieve school official."
        });
    }
};

const createSchoolOfficial = async (req, res) => {
    const {
        officialType,
        name,
        title,
        signatureUrl,
        stampUrl
    } = req.body;

    if (!officialType || !name || !title) {
        return res.status(400).json({
            message: "Official type, name, and title are required."
        });
    }

    const validOfficialTypes = [
        "principal",
        "exam_officer",
        "accounting_officer"
    ];

    if (!validOfficialTypes.includes(officialType)) {
        return res.status(400).json({
            message: "Invalid official type."
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO school_officials (
                school_id,
                official_type,
                name,
                title,
                signature_url,
                stamp_url
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                official_type,
                name,
                title,
                signature_url,
                stamp_url,
                created_at,
                updated_at
            `,
            [
                req.schoolId,
                officialType,
                name,
                title,
                signatureUrl || null,
                stampUrl || null
            ]
        );

        return res.status(201).json({
            message: "School official created successfully.",
            official: result.rows[0]
        });
    } catch (error) {
        console.error("Create school official error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "An official of this type already exists for this school."
            });
        }

        return res.status(500).json({
            message: "Failed to create school official."
        });
    }
};

const updateSchoolOfficial = async (req, res) => {
    const { id } = req.params;

    const {
        officialType,
        name,
        title,
        signatureUrl,
        stampUrl
    } = req.body;

    if (!officialType || !name || !title) {
        return res.status(400).json({
            message: "Official type, name, and title are required."
        });
    }

    const validOfficialTypes = [
        "principal",
        "exam_officer",
        "accounting_officer"
    ];

    if (!validOfficialTypes.includes(officialType)) {
        return res.status(400).json({
            message: "Invalid official type."
        });
    }

    try {
        const result = await pool.query(
            `
            UPDATE school_officials
            SET
                official_type = $1,
                name = $2,
                title = $3,
                signature_url = $4,
                stamp_url = $5,
                updated_at = NOW()
            WHERE id = $6
              AND school_id = $7
            RETURNING
                id,
                official_type,
                name,
                title,
                signature_url,
                stamp_url,
                created_at,
                updated_at
            `,
            [
                officialType,
                name,
                title,
                signatureUrl || null,
                stampUrl || null,
                id,
                req.schoolId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "School official not found."
            });
        }

        return res.status(200).json({
            message: "School official updated successfully.",
            official: result.rows[0]
        });
    } catch (error) {
        console.error("Update school official error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "An official of this type already exists for this school."
            });
        }

        return res.status(500).json({
            message: "Failed to update school official."
        });
    }
};

const deleteSchoolOfficial = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            DELETE FROM school_officials
            WHERE id = $1
              AND school_id = $2
            RETURNING id
            `,
            [id, req.schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "School official not found."
            });
        }

        return res.status(200).json({
            message: "School official deleted successfully."
        });
    } catch (error) {
        console.error("Delete school official error:", error);

        return res.status(500).json({
            message: "Failed to delete school official."
        });
    }
};

export {
    getSchoolOfficials,
    getSchoolOfficial,
    createSchoolOfficial,
    updateSchoolOfficial,
    deleteSchoolOfficial
};
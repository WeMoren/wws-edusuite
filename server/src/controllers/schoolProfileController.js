import pool from "../config/db.js";

const getSchoolProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                address,
                website,
                logo_url,
                created_at,
                updated_at
            FROM schools
            WHERE id = $1
            `,
            [req.schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "School profile not found.",
            });
        }

        return res.status(200).json({
            profile: result.rows[0],
        });
    } catch (error) {
        console.error("Get school profile error:", error);

        return res.status(500).json({
            message: "Failed to retrieve school profile.",
        });
    }
};

const updateSchoolProfile = async (req, res) => {
    const {
        name,
        email,
        phone,
        address,
        website,
        logoUrl,
    } = req.body;

    if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !email.trim()
    ) {
        return res.status(400).json({
            message: "School name and email are required.",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedWebsite =
        typeof website === "string" && website.trim()
            ? website.trim()
            : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({
            message: "Please provide a valid school email address.",
        });
    }

    if (normalizedWebsite) {
        try {
            const websiteUrl = new URL(normalizedWebsite);

            if (!["http:", "https:"].includes(websiteUrl.protocol)) {
                throw new Error("Unsupported URL protocol.");
            }
        } catch {
            return res.status(400).json({
                message: "Please provide a valid website URL, including https://.",
            });
        }
    }

    if (
        phone !== undefined &&
        phone !== null &&
        typeof phone !== "string"
    ) {
        return res.status(400).json({
            message: "Phone must be a string.",
        });
    }

    if (
        address !== undefined &&
        address !== null &&
        typeof address !== "string"
    ) {
        return res.status(400).json({
            message: "Address must be a string.",
        });
    }

    if (
        logoUrl !== undefined &&
        logoUrl !== null &&
        typeof logoUrl !== "string"
    ) {
        return res.status(400).json({
            message: "Logo URL must be a string.",
        });
    }

    try {
        const result = await pool.query(
            `
            UPDATE schools
            SET
                name = $1,
                email = $2,
                phone = CASE WHEN $3 THEN $4 ELSE phone END,
                address = CASE WHEN $5 THEN $6 ELSE address END,
                website = CASE WHEN $7 THEN $8 ELSE website END,
                logo_url = CASE WHEN $9 THEN $10 ELSE logo_url END,
                updated_at = NOW()
            WHERE id = $11
            RETURNING
                id,
                name,
                email,
                phone,
                address,
                website,
                logo_url,
                created_at,
                updated_at
            `,
            [
                name.trim(),
                normalizedEmail,
                phone !== undefined,
                phone?.trim() || null,
                address !== undefined,
                address?.trim() || null,
                website !== undefined,
                normalizedWebsite,
                logoUrl !== undefined,
                logoUrl?.trim() || null,
                req.schoolId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "School profile not found.",
            });
        }

        return res.status(200).json({
            message: "School profile updated successfully.",
            profile: result.rows[0],
        });
    } catch (error) {
        console.error("Update school profile error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "That school email address is already in use.",
            });
        }

        return res.status(500).json({
            message: "Failed to update school profile.",
        });
    }
};

export {
    getSchoolProfile,
    updateSchoolProfile,
};

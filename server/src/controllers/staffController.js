import pool from "../config/db.js";

export const getStaff = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                ss.id,
                ss.school_id,
                ss.staff_id,
                ss.first_name,
                ss.last_name,
                ss.gender,
                ss.status,
                ss.created_at,
                ss.updated_at,

                sp.code AS position_code,
                sp.name AS position_name,

                t.id AS teacher_id,
                t.subject AS teacher_subject

            FROM school_staff ss

            LEFT JOIN staff_position_assignments spa
                ON spa.staff_id = ss.id
               AND spa.school_id = ss.school_id
               AND spa.status = 'active'

            LEFT JOIN staff_positions sp
                ON sp.id = spa.position_id

            LEFT JOIN teachers t
                ON t.staff_id = ss.id
               AND t.school_id = ss.school_id

            WHERE ss.school_id = $1

            ORDER BY ss.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            staff: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch staff:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch staff.",
        });
    }
};

export const getStaffById = async (req, res) => {
    try {
        const { schoolId } = req;
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                ss.id,
                ss.school_id,
                ss.staff_id,
                ss.first_name,
                ss.last_name,
                ss.gender,
                ss.status,
                ss.created_at,
                ss.updated_at,

                sp.code AS position_code,
                sp.name AS position_name,

                t.id AS teacher_id,
                t.subject AS teacher_subject

            FROM school_staff ss

            LEFT JOIN staff_position_assignments spa
                ON spa.staff_id = ss.id
               AND spa.school_id = ss.school_id
               AND spa.status = 'active'

            LEFT JOIN staff_positions sp
                ON sp.id = spa.position_id

            LEFT JOIN teachers t
                ON t.staff_id = ss.id
               AND t.school_id = ss.school_id

            WHERE ss.id = $1
              AND ss.school_id = $2;
            `,
            [id, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Staff member not found.",
            });
        }

        return res.status(200).json({
            staff: result.rows[0],
        });
    } catch (error) {
        console.error(
            "Failed to fetch staff member:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch staff member.",
        });
    }
};


export const createStaff = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;

        const {
            staffId,
            firstName,
            lastName,
            gender,
            positionCode,
            subject,
        } = req.body;

        if (
            !staffId ||
            !firstName ||
            !lastName ||
            !positionCode
        ) {
            return res.status(400).json({
                message:
                    "Staff ID, first name, last name, and position are required.",
            });
        }

        if (
            gender !== undefined &&
            gender !== null &&
            !["Male", "Female"].includes(gender)
        ) {
            return res.status(400).json({
                message: "Gender must be Male or Female.",
            });
        }

        await client.query("BEGIN");

        /*
         * Validate the position using its stable code.
         */
        const positionResult = await client.query(
            `
            SELECT id, code, name
            FROM staff_positions
            WHERE code = $1;
            `,
            [positionCode]
        );

        if (positionResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Invalid staff position.",
            });
        }

        const position = positionResult.rows[0];

        /*
         * Teacher and Head Teacher positions require
         * a teacher subject under the current schema.
         */
        if (
            ["teacher", "head_teacher"].includes(position.code) &&
            !subject
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Subject is required for Teacher and Head Teacher positions.",
            });
        }

        /*
         * Non-teaching positions must not receive a
         * teacher subject through this endpoint.
         */
        if (
            !["teacher", "head_teacher"].includes(position.code) &&
            subject
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Subject can only be assigned to Teacher or Head Teacher positions.",
            });
        }

        /*
         * Create the core staff record.
         */
        const staffResult = await client.query(
            `
            INSERT INTO school_staff (
                school_id,
                staff_id,
                first_name,
                last_name,
                gender
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING
                id,
                school_id,
                staff_id,
                first_name,
                last_name,
                gender,
                status,
                created_at,
                updated_at;
            `,
            [
                schoolId,
                staffId,
                firstName,
                lastName,
                gender ?? null,
            ]
        );

        const staff = staffResult.rows[0];

        /*
         * Assign the staff member's active organizational position.
         */
        await client.query(
            `
            INSERT INTO staff_position_assignments (
                school_id,
                staff_id,
                position_id
            )
            VALUES (
                $1,
                $2,
                $3
            );
            `,
            [
                schoolId,
                staff.id,
                position.id,
            ]
        );

        /*
         * Create the teacher profile when the position
         * is Teacher or Head Teacher.
         */
        if (
            ["teacher", "head_teacher"].includes(position.code)
        ) {
            await client.query(
                `
                INSERT INTO teachers (
                    school_id,
                    staff_id,
                    subject
                )
                VALUES (
                    $1,
                    $2,
                    $3
                );
                `,
                [
                    schoolId,
                    staff.id,
                    subject,
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Staff member created successfully.",
            staff: {
                ...staff,
                position_code: position.code,
                position_name: position.name,
                teacher_subject:
                    ["teacher", "head_teacher"].includes(
                        position.code
                    )
                        ? subject
                        : null,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            if (
                error.constraint ===
                "unique_staff_id_per_school"
            ) {
                return res.status(409).json({
                    message:
                        "A staff member with this staff ID already exists.",
                });
            }

            if (
                error.constraint ===
                "unique_active_head_teacher_per_school"
            ) {
                return res.status(409).json({
                    message:
                        "This school already has an active Head Teacher.",
                });
            }

            if (
                error.constraint ===
                "unique_teacher_staff_per_school"
            ) {
                return res.status(409).json({
                    message:
                        "This staff member already has a teacher profile.",
                });
            }
        }

        console.error(
            "Failed to create staff member:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create staff member.",
        });
    } finally {
        client.release();
    }
};

export const updateStaff = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        const {
            firstName,
            lastName,
            gender,
            positionCode,
            subject,
        } = req.body;

        await client.query("BEGIN");

        /*
         * Lock the staff record while the related
         * position/profile changes are being made.
         */
        const staffResult = await client.query(
            `
            SELECT
                id,
                school_id,
                staff_id,
                first_name,
                last_name,
                gender,
                status
            FROM school_staff
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (staffResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Staff member not found.",
            });
        }

        const existingStaff = staffResult.rows[0];

        if (existingStaff.status !== "active") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Inactive staff members cannot be edited. Reactivate the staff member first.",
            });
        }

        if (
            gender !== undefined &&
            gender !== null &&
            !["Male", "Female"].includes(gender)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Gender must be Male or Female.",
            });
        }

        /*
         * Get the current active organizational position.
         */
        const currentPositionResult = await client.query(
            `
            SELECT
                spa.id AS assignment_id,
                sp.id AS position_id,
                sp.code AS position_code,
                sp.name AS position_name
            FROM staff_position_assignments spa

            JOIN staff_positions sp
                ON sp.id = spa.position_id

            WHERE spa.staff_id = $1
              AND spa.school_id = $2
              AND spa.status = 'active'
            ORDER BY spa.assigned_at DESC
            LIMIT 1
            FOR UPDATE OF spa;
            `,
            [id, schoolId]
        );

        const currentPosition =
            currentPositionResult.rows[0] || null;

        /*
         * Resolve the next position.
         */
        let nextPosition = currentPosition;

        if (positionCode !== undefined) {
            const positionResult = await client.query(
                `
                SELECT
                    id,
                    code,
                    name
                FROM staff_positions
                WHERE code = $1;
                `,
                [positionCode]
            );

            if (positionResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Invalid staff position.",
                });
            }

            nextPosition = positionResult.rows[0];
        }

        if (!nextPosition) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Staff member must have an organizational position.",
            });
        }

        const teachingPosition =
            ["teacher", "head_teacher"].includes(
                nextPosition.code
            );

        /*
         * Get any existing teacher profile.
         */
        const teacherResult = await client.query(
            `
            SELECT
                id,
                subject
            FROM teachers
            WHERE staff_id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        const existingTeacher =
            teacherResult.rows[0] || null;

        /*
         * Determine the next teacher subject.
         */
        let nextSubject = null;

        if (teachingPosition) {
            nextSubject =
                subject !== undefined
                    ? subject
                    : existingTeacher?.subject;

            if (!nextSubject) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        "Subject is required for Teacher and Head Teacher positions.",
                });
            }
        } else if (
            subject !== undefined &&
            subject !== null &&
            subject !== ""
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Subject can only be assigned to Teacher or Head Teacher positions.",
            });
        }

        /*
         * Update the core staff identity.
         */
        const updatedStaffResult = await client.query(
            `
            UPDATE school_staff
            SET
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                gender = CASE
                    WHEN $3::text IS NULL THEN gender
                    ELSE $3
                END,
                updated_at = NOW()
            WHERE id = $4
              AND school_id = $5
            RETURNING
                id,
                school_id,
                staff_id,
                first_name,
                last_name,
                gender,
                status,
                created_at,
                updated_at;
            `,
            [
                firstName ?? null,
                lastName ?? null,
                gender === undefined
                    ? null
                    : gender,
                id,
                schoolId,
            ]
        );

        const updatedStaff =
            updatedStaffResult.rows[0];

        /*
         * If the position changed, preserve the old
         * assignment as history and create a new one.
         */
        const positionChanged =
            !currentPosition ||
            currentPosition.position_code !==
                nextPosition.code;

        if (positionChanged) {
            if (currentPosition) {
                await client.query(
                    `
                    UPDATE staff_position_assignments
                    SET
                        status = 'inactive',
                        ended_at = NOW()
                    WHERE id = $1
                      AND school_id = $2
                      AND status = 'active';
                    `,
                    [
                        currentPosition.assignment_id,
                        schoolId,
                    ]
                );
            }

            await client.query(
                `
                INSERT INTO staff_position_assignments (
                    school_id,
                    staff_id,
                    position_id
                )
                VALUES (
                    $1,
                    $2,
                    $3
                );
                `,
                [
                    schoolId,
                    id,
                    nextPosition.id,
                ]
            );
        }

        /*
         * Create or update the teacher profile only
         * when the next position is a teaching position.
         *
         * Existing teacher profiles are intentionally
         * preserved when a staff member moves away
         * from a teaching position.
         */
        if (teachingPosition) {
            if (existingTeacher) {
                await client.query(
                    `
                    UPDATE teachers
                    SET
                        subject = $1,
                        updated_at = NOW()
                    WHERE id = $2
                      AND school_id = $3;
                    `,
                    [
                        nextSubject,
                        existingTeacher.id,
                        schoolId,
                    ]
                );
            } else {
                await client.query(
                    `
                    INSERT INTO teachers (
                        school_id,
                        staff_id,
                        subject
                    )
                    VALUES (
                        $1,
                        $2,
                        $3
                    );
                    `,
                    [
                        schoolId,
                        id,
                        nextSubject,
                    ]
                );
            }
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Staff member updated successfully.",
            staff: {
                ...updatedStaff,
                position_code: nextPosition.code,
                position_name: nextPosition.name,
                teacher_subject: teachingPosition
                    ? nextSubject
                    : existingTeacher?.subject ?? null,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            if (
                error.constraint ===
                "unique_active_head_teacher_per_school"
            ) {
                return res.status(409).json({
                    message:
                        "This school already has an active Head Teacher.",
                });
            }

            if (
                error.constraint ===
                "unique_teacher_staff_per_school"
            ) {
                return res.status(409).json({
                    message:
                        "This staff member already has a teacher profile.",
                });
            }
        }

        console.error(
            "Failed to update staff member:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update staff member.",
        });
    } finally {
        client.release();
    }
};

export const deleteStaff = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        await client.query("BEGIN");

        /*
         * Lock the staff record before deactivating it.
         */
        const staffResult = await client.query(
            `
            SELECT
                id,
                staff_id,
                status
            FROM school_staff
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (staffResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Staff member not found.",
            });
        }

        const staff = staffResult.rows[0];

        if (staff.status === "inactive") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Staff member is already inactive.",
            });
        }

        /*
         * Deactivate the staff identity.
         */
        await client.query(
            `
            UPDATE school_staff
            SET
                status = 'inactive',
                updated_at = NOW()
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        /*
         * End every active organizational position
         * currently assigned to this staff member.
         */
        await client.query(
            `
            UPDATE staff_position_assignments
            SET
                status = 'inactive',
                ended_at = NOW()
            WHERE staff_id = $1
              AND school_id = $2
              AND status = 'active';
            `,
            [id, schoolId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Staff member deactivated successfully.",
            staffId: staff.staff_id,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Failed to deactivate staff member:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to deactivate staff member.",
        });
    } finally {
        client.release();
    }
};

export const reactivateStaff = async (req, res) => {
    const client = await pool.connect();

    try {
        const { schoolId } = req;
        const { id } = req.params;

        await client.query("BEGIN");

        /*
         * Lock the staff record before reactivation.
         */
        const staffResult = await client.query(
            `
            SELECT
                id,
                staff_id,
                status
            FROM school_staff
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [id, schoolId]
        );

        if (staffResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Staff member not found.",
            });
        }

        const staff = staffResult.rows[0];

        if (staff.status === "active") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Staff member is already active.",
            });
        }

        /*
         * Find the most recently assigned position.
         *
         * We use assignment history rather than assuming
         * the staff member's position from the teacher profile.
         */
        const positionResult = await client.query(
            `
            SELECT
                spa.position_id,
                sp.code AS position_code,
                sp.name AS position_name
            FROM staff_position_assignments spa

            JOIN staff_positions sp
                ON sp.id = spa.position_id

            WHERE spa.staff_id = $1
              AND spa.school_id = $2

            ORDER BY spa.assigned_at DESC
            LIMIT 1;
            `,
            [id, schoolId]
        );

        if (positionResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Staff member has no position history and cannot be reactivated.",
            });
        }

        const position = positionResult.rows[0];

        /*
         * Reactivate the staff identity.
         */
        await client.query(
            `
            UPDATE school_staff
            SET
                status = 'active',
                updated_at = NOW()
            WHERE id = $1
              AND school_id = $2;
            `,
            [id, schoolId]
        );

        /*
         * Create a new active assignment.
         *
         * The previous inactive assignment remains untouched
         * as historical record.
         */
        await client.query(
            `
            INSERT INTO staff_position_assignments (
                school_id,
                staff_id,
                position_id
            )
            VALUES (
                $1,
                $2,
                $3
            );
            `,
            [
                schoolId,
                id,
                position.position_id,
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Staff member reactivated successfully.",
            staffId: staff.staff_id,
            positionCode: position.position_code,
            positionName: position.position_name,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (
            error.code === "23505" &&
            error.constraint ===
                "unique_active_head_teacher_per_school"
        ) {
            return res.status(409).json({
                message:
                    "This staff member cannot be reactivated as Head Teacher because the school already has an active Head Teacher.",
            });
        }

        console.error(
            "Failed to reactivate staff member:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to reactivate staff member.",
        });
    } finally {
        client.release();
    }
};

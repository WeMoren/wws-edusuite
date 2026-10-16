import pool from "../config/db.js";
import { randomBytes, createHash } from "node:crypto";
import { hashPassword } from "../utils/password.js";
import { sendStaffInvitationEmail } from "../services/emailService.js";

// Staff positions permitted to receive login invitations.
const invitationEligiblePositions = [
"principal",
"school_admin",
"head_teacher",
"exam_officer",
"accountant",
];

// Resolve the application role from the staff member's current position.
const positionRoleNames = {
principal: "Principal",
school_admin: "School Admin",
head_teacher: "Teacher",
exam_officer: "Exam Officer",
accountant: "Accountant",
};

// Invitation validity period, in hours.
const INVITATION_EXPIRY_HOURS = 48;
const MIN_PASSWORD_LENGTH = 12;
const isValidInvitationPassword = (password) => {
    return (
        typeof password === "string" &&
        password.length >= MIN_PASSWORD_LENGTH
    );
};
const generateInvitationToken = () => {
const token = randomBytes(32).toString("hex");


const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

return { token, tokenHash };


};


const getFrontendUrl = () => {
const frontendUrl = process.env.FRONTEND_URL?.trim();


if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured.");
}

let parsedUrl;

try {
    parsedUrl = new URL(frontendUrl);
} catch {
    throw new Error("FRONTEND_URL is invalid.");
}

if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password
) {
    throw new Error("FRONTEND_URL is invalid.");
}

return parsedUrl.origin;
};


const getEligiblePositionRole = async (client, schoolId, staffId) => {
const result = await client.query(
`         SELECT sp.code AS position_code
        FROM staff_position_assignments spa
        JOIN staff_positions sp
            ON sp.id = spa.position_id
        WHERE spa.school_id = $1
          AND spa.staff_id = $2
          AND spa.status = 'active'
          AND sp.code = ANY($3::text[])
        ORDER BY spa.assigned_at DESC
        LIMIT 1;
        `,
[schoolId, staffId, invitationEligiblePositions]
);


const positionCode = result.rows[0]?.position_code;

if (!positionCode) {
    return null;
}

return {
    positionCode,
    roleName: positionRoleNames[positionCode],
};
};



const invalidatePendingInvitations = async (
client,
schoolId,
staffId
) => {
await client.query(
`         UPDATE staff_invitations
        SET invalidated_at = NOW()
        WHERE school_id = $1
          AND school_staff_id = $2
          AND accepted_at IS NULL
          AND invalidated_at IS NULL;
        `,
[schoolId, staffId]
);
};



export const createStaffInvitation = async (req, res) => {
const { id: staffId } = req.params;
const schoolId = req.schoolId;
const invitedByUserId = req.user.userId;


if (!staffId || !schoolId || !invitedByUserId) {
    return res.status(400).json({
        message: "Required invitation details are missing.",
    });
}


let invitationId;
let client;
let transactionStarted = false;

try {
    client = await pool.connect();
    const frontendUrl = getFrontendUrl();

    await client.query("BEGIN");
    transactionStarted = true;

    const staffResult = await client.query(
        `
        SELECT
            ss.id,
            ss.first_name,
            ss.last_name,
            ss.email,
            ss.status
        FROM school_staff ss
        WHERE ss.id = $1
          AND ss.school_id = $2
        FOR UPDATE;
        `,
        [staffId, schoolId]
    );

    if (staffResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
            message: "Staff member not found.",
        });
    }

    const staff = staffResult.rows[0];

    const inviterResult = await client.query(
`     SELECT first_name, last_name
        FROM users
        WHERE id = $1
        AND school_id = $2
        LIMIT 1;
            `,
        [invitedByUserId, schoolId]
    );

    if (inviterResult.rows.length === 0) {
      await client.query("ROLLBACK");


        return res.status(403).json({
            message: "The inviting user could not be verified.",
        });


        }

    const inviter = inviterResult.rows[0];
    const inviterName = `${inviter.first_name} ${inviter.last_name}`;


    if (staff.status !== "active") {
        await client.query("ROLLBACK");

        return res.status(400).json({
            message: "Inactive staff cannot be invited.",
        });
    }

    if (!staff.email) {
        await client.query("ROLLBACK");

        return res.status(400).json({
            message: "Add an official staff email before sending an invitation.",
        });
    }

    const positionRole = await getEligiblePositionRole(
        client,
        schoolId,
        staffId
    );

    if (!positionRole) {
        await client.query("ROLLBACK");

        return res.status(400).json({
            message: "This staff position is not eligible for an invitation.",
        });
    }

    const existingUser = await client.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1;
        `,
        [staff.email]
    );

    if (existingUser.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
            message: "This email is already associated with a login account.",
        });
    }

    await invalidatePendingInvitations(
        client,
        schoolId,
        staffId
    );

    const { token, tokenHash } = generateInvitationToken();

    const invitationResult = await client.query(
        `
        INSERT INTO staff_invitations (
            school_id,
            school_staff_id,
            invited_by_user_id,
            email,
            token_hash,
            expires_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            NOW() + ($6 * INTERVAL '1 hour')
        )
        RETURNING id, expires_at;
        `,
        [
            schoolId,
            staffId,
            invitedByUserId,
            staff.email,
            tokenHash,
            INVITATION_EXPIRY_HOURS,
        ]
    );

   const invitation = invitationResult.rows[0];
    invitationId = invitation.id;

    await client.query("COMMIT");
    transactionStarted = false;

    const acceptanceUrl =
        `${frontendUrl}/accept-invitation?token=${encodeURIComponent(token)}`;


        await sendStaffInvitationEmail({
            to: staff.email,
            staffName: `${staff.first_name} ${staff.last_name}`,
            inviterName,
            invitationUrl: acceptanceUrl,
            expiresAt: invitation.expires_at,
        });


    return res.status(201).json({
        message: "Staff invitation sent successfully.",
        invitationId,
        expiresInHours: INVITATION_EXPIRY_HOURS,
    });
} catch (error) {
    if (client && transactionStarted) {
        try {
            await client.query("ROLLBACK");
            transactionStarted = false;
        } catch (rollbackError) {
            console.error(
                "Failed to roll back staff invitation transaction:",
                rollbackError.message
            );
        }
    }

    if (invitationId) {
        try {
            await pool.query(
                `
                UPDATE staff_invitations
                SET invalidated_at = NOW()
                WHERE id = $1
                  AND accepted_at IS NULL
                  AND invalidated_at IS NULL;
                `,
                [invitationId]
            );
        } catch (invalidationError) {
            console.error(
                "Failed to invalidate unsent staff invitation:",
                invalidationError.message
            );
        }
    }

    console.error(
        "Failed to create staff invitation:",
        error.message
    );

    return res.status(500).json({
        message: "Failed to send staff invitation. Please try again.",
    });
} finally {
    client?.release();
}
};



export const acceptStaffInvitation = async (req, res) => {
    const { token, password } = req.body || {};


    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        return res.status(400).json({
            message: "A valid invitation token is required.",
        });
    }

    if (!isValidInvitationPassword(password)) {
        return res.status(400).json({
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        });
    }

    const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

    let client;
    let transactionStarted = false;

    try {
          client = await pool.connect();
        await client.query("BEGIN");
        transactionStarted = true;

        const invitationResult = await client.query(
            `
            SELECT
                si.id AS invitation_id,
                si.school_id,
                si.school_staff_id,
                si.email AS invitation_email,
                si.expires_at,
                si.accepted_at,
                si.invalidated_at,
                ss.first_name,
                ss.last_name,
                ss.email AS staff_email,
                ss.status AS staff_status
            FROM staff_invitations si
            JOIN school_staff ss
                ON ss.id = si.school_staff_id
            AND ss.school_id = si.school_id
            WHERE si.token_hash = $1
            FOR UPDATE OF si, ss;
            `,
            [tokenHash]
        );

        const invitation = invitationResult.rows[0];

        if (!invitation) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This invitation is invalid or no longer available.",
            });
        }

        if (
            invitation.accepted_at ||
            invitation.invalidated_at ||
            new Date(invitation.expires_at).getTime() <= Date.now()
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This invitation is invalid, expired, or already used.",
            });
        }

        if (
            invitation.staff_status !== "active" ||
            !invitation.staff_email ||
            !invitation.invitation_email ||
            invitation.staff_email.trim().toLowerCase() !==
                invitation.invitation_email.trim().toLowerCase()
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This invitation is no longer valid for this staff member.",
            });
        }

    const positionRole = await getEligiblePositionRole(
            client,
            invitation.school_id,
            invitation.school_staff_id
    );

    if (!positionRole) {
        await client.query("ROLLBACK");


    return res.status(400).json({
        message: "This invitation is no longer valid for the staff member's current position.",
    });


    }

    const roleResult = await client.query(
    `     SELECT id, name
        FROM roles
        WHERE name = $1
        LIMIT 1;
        `,
    [positionRole.roleName]
    );

    const role = roleResult.rows[0];

    if (!role) {
         throw new Error("The required application role is not configured.");
    }

     const existingUserResult = await client.query(
    `     SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1;
        `,
    [invitation.invitation_email]
    );

    if (existingUserResult.rows.length > 0) {
         await client.query("ROLLBACK");


        return res.status(409).json({
            message: "An account already exists for this email address. Please contact your school administrator.",
        });
    }

    const passwordHash = await hashPassword(password);

        const userResult = await client.query(
        `     INSERT INTO users (
                school_id,
                first_name,
                last_name,
                email,
                password_hash,
                status,
                school_staff_id
            )
                VALUES ($1, $2, $3, $4, $5, 'active', $6)
                RETURNING id, school_id, first_name, last_name, email, status;
            `,
        [
            invitation.school_id,
            invitation.first_name,
            invitation.last_name,
            invitation.staff_email.trim().toLowerCase(),
            passwordHash,
            invitation.school_staff_id,
        ]
        );

    const user = userResult.rows[0];

    await client.query(
`     INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2);
    `,
     [user.id, role.id]
    );


    const acceptedInvitationResult = await client.query(
        `     UPDATE staff_invitations
            SET accepted_at = NOW()
            WHERE id = $1
            AND accepted_at IS NULL
            AND invalidated_at IS NULL
            AND expires_at > NOW()
            RETURNING id;
            `,
         [invitation.invitation_id]
        );

        if (acceptedInvitationResult.rows.length === 0) {
             throw new Error("The invitation could not be marked as accepted.");
        }

        await client.query("COMMIT");
          transactionStarted = false;

        return res.status(201).json({
             message: "Invitation accepted successfully. You can now sign in.",
        user: {
            id: user.id,
            schoolId: user.school_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            status: user.status,
        },
    });



    } catch (error) {
        if(client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Invitation transaction rollback failed:",
                    rollbackError
                );
            }
        }

    if (error.code === "23505") {
        return res.status(409).json({
        message: "An account or related record already exists. Please contact your school administrator.",
    });
}


        console.error("Staff invitation acceptance error:", error);

        return res.status(500).json({
            message: "Unable to process the invitation. Please try again.",
        });
    } finally {
        client?.release();
    }
};

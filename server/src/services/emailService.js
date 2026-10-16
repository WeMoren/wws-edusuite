import { Resend } from "resend";

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });

export const sendStaffInvitationEmail = async ({
    to,
    staffName,
    inviterName,
    invitationUrl,
    expiresAt,
}) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
        throw new Error(
            "Staff invitation email is not configured. Check RESEND_API_KEY and RESEND_FROM_EMAIL."
        );
    }

    if (!to || !invitationUrl || !expiresAt) {
        throw new Error(
            "Recipient email, invitation URL, and expiry date are required."
        );
    }

        const expiryDate = new Date(expiresAt);

    if (Number.isNaN(expiryDate.getTime())) {
        throw new Error("A valid invitation expiry date is required.");
    }

    let parsedInvitationUrl;

    try {
        parsedInvitationUrl = new URL(invitationUrl);
    } catch {
        throw new Error("A valid invitation URL is required.");
    }

    if (
        !["http:", "https:"].includes(parsedInvitationUrl.protocol) ||
        parsedInvitationUrl.username ||
        parsedInvitationUrl.password
    ) {
        throw new Error("A valid invitation URL is required.");
    }

    const recipientName = escapeHtml(staffName || "there");
    const senderName = escapeHtml(
        inviterName || "Your school administrator"
    );

    const expiryText = expiryDate.toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos",
    });

    const safeInvitationUrl = escapeHtml(parsedInvitationUrl.href);

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
        from,
        to,
        subject: "Your WWS-EduSuite staff account invitation",
        text: [
            `Hello ${staffName || "there"},`,
            "",
            `${inviterName || "Your school administrator"} has invited you to set up your WWS-EduSuite staff account.`,
            "",
            `Accept your invitation using this link: ${invitationUrl}`,
            "",
            `This invitation expires on ${expiryText} (Nigeria time).`,
            "",
            "If you were not expecting this invitation, you can ignore this email.",
            "",
            "WWS-EduSuite",
        ].join("\n"),
        html: `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Staff Account Invitation</title>
                </head>
                <body style="margin:0;padding:24px;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                    <div style="max-width:560px;margin:0 auto;padding:32px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
                        <h1 style="margin:0 0 24px;font-size:24px;color:#1d4ed8;">WWS-EduSuite</h1>

                        <h2 style="margin:0 0 16px;font-size:20px;">Staff account invitation</h2>

                        <p>Hello ${recipientName},</p>

                        <p>${senderName} has invited you to set up your staff account on WWS-EduSuite.</p>

                        <p style="margin:28px 0;text-align:center;">
                            <a
                                href="${safeInvitationUrl}"
                                style="display:inline-block;padding:13px 22px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
                            >
                                Accept Invitation
                            </a>
                        </p>

                        <p>If the button does not work, copy and paste this link into your browser:</p>

                        <p style="overflow-wrap:anywhere;">
                            <a href="${safeInvitationUrl}" style="color:#2563eb;">${safeInvitationUrl}</a>
                        </p>

                        <p>This invitation expires on <strong>${escapeHtml(expiryText)}</strong> (Nigeria time).</p>

                        <p>If you were not expecting this invitation, you can ignore this email.</p>

                        <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />

                        <p style="margin:0;font-size:12px;color:#6b7280;">
                            This is an automated message from WWS-EduSuite. Please do not reply directly to this email.
                        </p>
                    </div>
                </body>
            </html>
        `,
    });

    if (error) {
        throw new Error(`Resend could not send the invitation email: ${error.message}`);
    }

    if (!data?.id) {
        throw new Error("Resend did not confirm that the invitation email was accepted.");
    }

    return {
        messageId: data.id,
    };
};



export const sendPasswordResetEmail = async ({
    to,
    recipientName,
    resetUrl,
    expiresInMinutes,
}) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
        throw new Error(
            "Password-reset email is not configured."
        );
    }

    if (
        typeof to !== "string" ||
        !to.trim() ||
        typeof resetUrl !== "string" ||
        !Number.isInteger(expiresInMinutes) ||
        expiresInMinutes < 1
    ) {
        throw new Error("Valid password-reset email details are required.");
    }

    const parsedResetUrl = new URL(resetUrl);

    if (
        !["http:", "https:"].includes(parsedResetUrl.protocol) ||
        parsedResetUrl.username ||
        parsedResetUrl.password
    ) {
        throw new Error("A valid password-reset URL is required.");
    }

    const safeRecipientName = escapeHtml(recipientName || "there");
    const safeResetUrl = escapeHtml(parsedResetUrl.href);

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
        from,
        to: to.trim(),
        subject: "Reset your WWS-EduSuite password",
        text: [
            `Hello ${recipientName || "there"},`,
            "",
            "We received a request to reset your WWS-EduSuite password.",
            "",
            `Use this link to choose a new password: ${parsedResetUrl.href}`,
            "",
            `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
            "",
            "If you did not request a password reset, you can ignore this email.",
            "",
            "WWS-EduSuite",
        ].join("\n"),
        html: `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Reset your password</title>
                </head>
                <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                    <main style="max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
                        <h1 style="color:#1d4ed8;">WWS-EduSuite</h1>
                        <h2>Reset your password</h2>
                        <p>Hello ${safeRecipientName},</p>
                        <p>We received a request to reset your WWS-EduSuite password.</p>
                        <p style="margin:28px 0;text-align:center;">
                            <a
                                href="${safeResetUrl}"
                                style="display:inline-block;padding:13px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
                            >
                                Reset Password
                            </a>
                        </p>
                        <p>If the button does not work, copy this link into your browser:</p>
                        <p style="overflow-wrap:anywhere;">
                            <a href="${safeResetUrl}">${safeResetUrl}</a>
                        </p>
                        <p>This link expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>
                        <p>If you did not request a password reset, you can ignore this email.</p>
                    </main>
                </body>
            </html>
        `,
    });

    if (error) {
        throw new Error(
            `Resend could not send the password-reset email: ${error.message}`
        );
    }

    if (!data?.id) {
        throw new Error(
            "Resend did not confirm acceptance of the password-reset email."
        );
    }

    return { messageId: data.id };
};

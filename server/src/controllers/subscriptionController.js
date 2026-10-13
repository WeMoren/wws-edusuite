import pool from "../config/db.js";


export const getSchoolSubscription = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                s.id,
                s.school_id,
                s.status,

                s.billing_period,
                s.price_per_student,
                s.active_student_count,
                s.amount,
                s.currency,

                s.trial_start,
                s.trial_end,

                s.start_date,
                s.end_date,
                s.grace_period_end,

                s.created_at,
                s.updated_at,

                p.id AS plan_id,
                p.name AS plan_name,
                p.description AS plan_description

            FROM subscriptions s

            JOIN subscription_plans p
                ON p.id = s.plan_id

            WHERE s.school_id = $1
            ORDER BY s.created_at DESC
            LIMIT 1;
            `,
            [schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No subscription found for this school.",
            });
        }

        const subscription = result.rows[0];

        let remainingTrialDays = 0;

        if (
            subscription.status === "trial" &&
            subscription.trial_end
        ) {
            const now = new Date();
            const trialEnd = new Date(subscription.trial_end);

            const difference =
                trialEnd.getTime() - now.getTime();

            remainingTrialDays = Math.max(
                0,
                Math.ceil(
                    difference / (1000 * 60 * 60 * 24)
                )
            );
        }

        return res.status(200).json({
            subscription: {
                ...subscription,
                remaining_trial_days: remainingTrialDays,
            },
        });
    } catch (error) {
        console.error(
            "Failed to fetch school subscription:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch school subscription.",
        });
    }
};


export const getSubscriptionPayments = async (req, res) => {
    try {
        const { schoolId } = req;

        const result = await pool.query(
            `
            SELECT
                sp.id,
                sp.subscription_id,
                sp.school_id,

                sp.amount,
                sp.currency,

                sp.status,
                sp.payment_reference,
                sp.payment_method,

                sp.paid_at,
                sp.created_at

            FROM subscription_payments sp

            WHERE sp.school_id = $1

            ORDER BY sp.created_at DESC;
            `,
            [schoolId]
        );

        return res.status(200).json({
            payments: result.rows,
        });
    } catch (error) {
        console.error(
            "Failed to fetch subscription payments:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch subscription payments.",
        });
    }
};


export const getSchoolSubscriptionQuote = async (req, res) => {
    try {
        const { schoolId } = req;

        const settingsResult = await pool.query(
            `
            SELECT minimum_annual_amount
            FROM platform_billing_settings
            WHERE singleton = TRUE;
            `
        );

        if (settingsResult.rows.length !== 1) {
            return res.status(500).json({
                message: "Subscription billing settings are unavailable.",
            });
        }

        const planResult = await pool.query(
            `
            SELECT
                id,
                name,
                price_per_student,
                billing_period,
                currency
            FROM subscription_plans
            WHERE is_active = TRUE;
            `
        );

        if (planResult.rows.length !== 1) {
            return res.status(503).json({
                message: "Exactly one active subscription plan is required.",
            });
        }

        const subscriptionResult = await pool.query(
            `
            SELECT id, status, end_date
            FROM subscriptions
            WHERE school_id = $1;
            `,
            [schoolId]
        );

        if (subscriptionResult.rows.length !== 1) {
            return res.status(409).json({
                message: "A school subscription must exist before a billing quote can be generated.",
            });
        }

        const subscription = subscriptionResult.rows[0];

        if (
            !["trial", "active", "expired"].includes(
                subscription.status
            )
        ) {
            return res.status(409).json({
                message: "This subscription cannot currently be renewed.",
            });
        }

        const sessionResult = await pool.query(
            `
            SELECT id
            FROM academic_sessions
            WHERE school_id = $1
              AND is_current = TRUE
            LIMIT 1;
            `,
            [schoolId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(409).json({
                message: "Set a current academic session before generating a subscription quote.",
            });
        }

        const studentCountResult = await pool.query(
            `
            SELECT COUNT(DISTINCT st.id)::int AS active_student_count
            FROM students st
            JOIN student_enrollments se
              ON se.student_id = st.id
             AND se.school_id = st.school_id
            JOIN academic_sessions acs
              ON acs.id = se.academic_session_id
             AND acs.school_id = se.school_id
            WHERE st.school_id = $1
              AND st.status = 'active'
              AND se.status = 'active'
              AND acs.is_current = TRUE;
            `,
            [schoolId]
        );

        const plan = planResult.rows[0];
        const settings = settingsResult.rows[0];
        const activeStudentCount =
            studentCountResult.rows[0].active_student_count;

        const pricePerStudent = Number(plan.price_per_student);
        const minimumAnnualAmount =
            Number(settings.minimum_annual_amount);

        const annualAmount = Math.round(
            Math.max(
                activeStudentCount * pricePerStudent,
                minimumAnnualAmount
            ) * 100
        ) / 100;

        return res.status(200).json({
            quote: {
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                active_student_count: activeStudentCount,
                price_per_student: pricePerStudent,
                minimum_annual_amount: minimumAnnualAmount,
                amount: annualAmount,
                currency: plan.currency,
                billing_period: plan.billing_period,
                plan_name: plan.name,
                academic_session_id: sessionResult.rows[0].id,
                valid_until: new Date(
                    Date.now() + 15 * 60 * 1000
                ).toISOString(),
            },
        });
    } catch (error) {
        console.error(
            "Failed to generate school subscription quote:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to generate subscription quote.",
        });
    }
};

export const initializeSchoolSubscriptionPayment = async (req, res) => {
    let paymentReference;

    try {
        const { schoolId } = req;
        const userId = req.user?.userId;
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        const frontendUrl = process.env.FRONTEND_URL;

        if (!paystackSecretKey) {
            return res.status(503).json({
                message: "Subscription payments are not configured yet.",
            });
        }

        if (!frontendUrl) {
            return res.status(503).json({
                message: "The frontend URL is not configured.",
            });
        }

        if (!userId) {
            return res.status(401).json({
                message: "Authenticated user information is missing.",
            });
        }

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const userResult = await client.query(
                `
                SELECT email
                FROM users
                WHERE id = $1
                  AND school_id = $2
                  AND status = 'active';
                `,
                [userId, schoolId]
            );

            if (userResult.rows.length !== 1) {
                await client.query("ROLLBACK");

                return res.status(403).json({
                    message: "An active billing contact could not be found.",
                });
            }

            const subscriptionResult = await client.query(
                `
                SELECT id, status
                FROM subscriptions
                WHERE school_id = $1
                FOR UPDATE;
                `,
                [schoolId]
            );

            if (subscriptionResult.rows.length !== 1) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    message: "A school subscription must exist before payment.",
                });
            }

            const subscription = subscriptionResult.rows[0];

            if (
                !["trial", "active", "expired"].includes(
                    subscription.status
                )
            ) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    message: "This subscription cannot currently be renewed.",
                });
            }

            const settingsResult = await client.query(
                `
                SELECT minimum_annual_amount
                FROM platform_billing_settings
                WHERE singleton = TRUE;
                `
            );

            const planResult = await client.query(
                `
                SELECT
                    id,
                    name,
                    price_per_student,
                    billing_period,
                    currency
                FROM subscription_plans
                WHERE is_active = TRUE;
                `
            );

            if (
                settingsResult.rows.length !== 1 ||
                planResult.rows.length !== 1
            ) {
                await client.query("ROLLBACK");

                return res.status(503).json({
                    message: "Subscription billing configuration is unavailable.",
                });
            }

            const sessionResult = await client.query(
                `
                SELECT id
                FROM academic_sessions
                WHERE school_id = $1
                  AND is_current = TRUE
                LIMIT 1;
                `,
                [schoolId]
            );

            if (sessionResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    message: "Set a current academic session before making a subscription payment.",
                });
            }

            const studentResult = await client.query(
                `
                SELECT COUNT(DISTINCT st.id)::int AS active_student_count
                FROM students st
                JOIN student_enrollments se
                  ON se.student_id = st.id
                 AND se.school_id = st.school_id
                JOIN academic_sessions acs
                  ON acs.id = se.academic_session_id
                 AND acs.school_id = se.school_id
                WHERE st.school_id = $1
                  AND st.status = 'active'
                  AND se.status = 'active'
                  AND acs.is_current = TRUE;
                `,
                [schoolId]
            );

            const plan = planResult.rows[0];
            const settings = settingsResult.rows[0];
            const activeStudentCount =
                studentResult.rows[0].active_student_count;

            const amountInNaira = Math.round(
                Math.max(
                    activeStudentCount * Number(plan.price_per_student),
                    Number(settings.minimum_annual_amount)
                ) * 100
            ) / 100;

            const amountInKobo = Math.round(amountInNaira * 100);

            if (
                !Number.isSafeInteger(amountInKobo) ||
                amountInKobo <= 0 ||
                plan.currency !== "NGN"
            ) {
                await client.query("ROLLBACK");

                return res.status(500).json({
                    message: "The calculated subscription amount is invalid.",
                });
            }

            const existingPendingResult = await client.query(
                    `
                    SELECT id, payment_reference, created_at
                    FROM subscription_payments
                    WHERE subscription_id = $1
                    AND school_id = $2
                    AND status = 'pending'
                    ORDER BY created_at DESC
                    LIMIT 1;
                    `,
                    [subscription.id, schoolId]
            );

            if (existingPendingResult.rows.length > 0) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    message:
                        "A subscription payment is still awaiting confirmation. " +
                        "Check Payment history and verify the existing transaction " +
                        "before starting another checkout.",
                    reference:
                        existingPendingResult.rows[0].payment_reference,
                });
            }


            const { randomUUID } = await import("node:crypto");
            paymentReference = `WWS-${randomUUID()}`;

            await client.query(
                `
                INSERT INTO subscription_payments (
                    subscription_id,
                    school_id,
                    amount,
                    currency,
                    status,
                    payment_reference,
                    payment_method,
                    active_student_count,
                    price_per_student
                )
                VALUES ($1, $2, $3, $4, 'pending', $5, 'paystack', $6, $7);
                `,
                [
                    subscription.id,
                    schoolId,
                    amountInNaira,
                    plan.currency,
                    paymentReference,
                    activeStudentCount,
                    Number(plan.price_per_student),
                ]
            );

            await client.query("COMMIT");

            const callbackUrl = new URL(
                "/dashboard/subscription/callback",
                frontendUrl
            );

            let paystackResponse;
let paystackResult;

try {
    paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: userResult.rows[0].email,
                amount: amountInKobo,
                currency: plan.currency,
                reference: paymentReference,
                callback_url: callbackUrl.toString(),
                metadata: {
                    school_id: schoolId,
                    subscription_id: subscription.id,
                },
            }),
            signal: AbortSignal.timeout(15000),
        }
    );

    paystackResult = await paystackResponse.json();
} catch (error) {
    // The request may have reached Paystack even if our response
    // was lost or timed out. Preserve the pending payment reference.
    console.error(
        "Paystack initialization outcome is uncertain:",
        error.message
    );

    return res.status(502).json({
        message:
            "We could not confirm whether checkout was initialized. " +
            "Check Payment history and use Verify payment for this reference " +
            "before attempting another payment.",
        reference: paymentReference,
    });
}

if (
    !paystackResponse.ok ||
    paystackResult.status !== true ||
    !paystackResult.data?.authorization_url
) {
    // A clear Paystack client-side rejection is treated as failed.
    // Server errors or malformed responses remain pending because
    // the transaction outcome may be uncertain.
    const definitiveRejection =
        paystackResponse.status >= 400 &&
        paystackResponse.status < 500 &&
        paystackResult.status === false;

    if (definitiveRejection) {
        await pool.query(
            `
            UPDATE subscription_payments
            SET status = 'failed'
            WHERE school_id = $1
              AND payment_reference = $2
              AND status = 'pending';
            `,
            [schoolId, paymentReference]
        );
    }

    console.error(
        "Paystack did not provide a usable checkout URL.",
        {
            httpStatus: paystackResponse.status,
            reference: paymentReference,
            definitiveRejection,
        }
    );

    return res.status(502).json({
        message: definitiveRejection
            ? "Paystack rejected the checkout request. Please review the payment details before trying again."
            : "We could not confirm whether checkout was initialized. Check Payment history and use Verify payment for this reference before attempting another payment.",
        reference: paymentReference,
    });
}

            return res.status(200).json({
                message: "Subscription payment initialized.",
                authorization_url:
                    paystackResult.data.authorization_url,
                reference: paymentReference,
                amount: amountInNaira,
                currency: plan.currency,
            });
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The transaction may already have been committed.
            }

            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(
            "Failed to initialize subscription payment:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to initialize subscription payment.",
        });
    }
};



export const verifySchoolSubscriptionPayment = async (req, res) => {
    const { schoolId } = req;
    const reference =
        typeof req.body?.reference === "string"
        ? req.body.reference.trim()
        : "";

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!reference || reference.length > 255) {
        return res.status(400).json({
            message: "A valid payment reference is required.",
        });
    }

    if (!paystackSecretKey) {
        return res.status(503).json({
            message: "Subscription payments are not configured yet.",
        });
}

try {
    // Find the payment within the authenticated school's records.
    const paymentResult = await pool.query(
        `
        SELECT
            id,
            subscription_id,
            amount,
            currency,
            status,
            payment_reference,
            active_student_count,
            price_per_student
        FROM subscription_payments
        WHERE school_id = $1
          AND payment_reference = $2;
        `,
        [schoolId, reference]
    );

    if (paymentResult.rows.length !== 1) {
        return res.status(404).json({
            message: "The subscription payment could not be found.",
        });
    }

    const payment = paymentResult.rows[0];

    // A completed payment must never renew the subscription twice.
    if (payment.status === "success") {
        return res.status(200).json({
            message: "This payment has already been verified.",
            already_processed: true,
        });
    }

    if (payment.status !== "pending") {
        return res.status(409).json({
            message: "This payment is not awaiting verification.",
        });
    }

         let paystackResponse;
    let paystackResult;

    try {
        paystackResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                    "Content-Type": "application/json",
                },
                signal: AbortSignal.timeout(15000),
            }
        );

        paystackResult = await paystackResponse.json();
    } catch (error) {
        console.error(
            "Paystack payment verification request failed:",
            error.message
        );

        return res.status(502).json({
            message:
                "We could not confirm the payment status with Paystack. " +
                "Your payment has not been marked as failed. " +
                "Please retry verification shortly.",
        });
    }

    if (
        !paystackResponse.ok ||
        paystackResult.status !== true ||
        !paystackResult.data
    ) {
        return res.status(502).json({
            message: "Paystack could not verify this payment. Please try again.",
        });
    }

    const transaction = paystackResult.data;

    if (transaction.reference !== reference) {
        return res.status(400).json({
            message: "The payment reference does not match.",
        });
    }

    if (transaction.status !== "success") {
        if (
            transaction.status === "failed" ||
            transaction.status === "abandoned"
        ) {
            const client = await pool.connect();

            try {
                await client.query("BEGIN");

                const lockedPaymentResult = await client.query(
                    `
                    SELECT id, status
                    FROM subscription_payments
                    WHERE school_id = $1
                      AND payment_reference = $2
                    FOR UPDATE;
                    `,
                    [schoolId, reference]
                );

                if (lockedPaymentResult.rows.length !== 1) {
                    await client.query("ROLLBACK");

                    return res.status(404).json({
                        message:
                            "The subscription payment could not be found.",
                    });
                }

                const lockedPayment = lockedPaymentResult.rows[0];

                if (lockedPayment.status === "success") {
                    await client.query("COMMIT");

                    return res.status(200).json({
                        message:
                            "This payment has already been verified.",
                        already_processed: true,
                    });
                }

                if (lockedPayment.status !== "pending") {
                    await client.query("ROLLBACK");

                    return res.status(409).json({
                        message:
                            "This payment is no longer awaiting verification.",
                    });
                }

                const updateResult = await client.query(
                    `
                    UPDATE subscription_payments
                    SET status = 'failed'
                    WHERE id = $1
                      AND school_id = $2
                      AND status = 'pending';
                    `,
                    [lockedPayment.id, schoolId]
                );

                if (updateResult.rowCount !== 1) {
                    throw new Error(
                        "The payment status could not be updated safely."
                    );
                }

                await client.query("COMMIT");
            } catch (error) {
                try {
                    await client.query("ROLLBACK");
                } catch {
                    // Preserve the original error.
                }

                throw error;
            } finally {
                client.release();
            }

            return res.status(400).json({
                message:
                    transaction.status === "abandoned"
                        ? "This payment was abandoned. Please start a new checkout."
                        : "Paystack reports that this payment failed.",
            });
        }

    if (transaction.status === "reversed") {
        return res.status(409).json({
            message:
                "Paystack reports that this transaction was reversed. Please contact support for review.",
        });
    }

    return res.status(409).json({
        message:
            "Payment is not yet confirmed as successful. Please try again shortly.",
    });
}

    const expectedAmountInKobo = Math.round(
        Number(payment.amount) * 100
    );

    if (
        !Number.isSafeInteger(expectedAmountInKobo) ||
        transaction.amount !== expectedAmountInKobo ||
        transaction.currency !== payment.currency ||
        payment.currency !== "NGN"
    ) {
        return res.status(400).json({
            message: "The verified payment amount or currency does not match the recorded payment.",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock the payment to prevent concurrent verification
        // requests from processing the same payment twice.
        const lockedPaymentResult = await client.query(
            `
            SELECT *
            FROM subscription_payments
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [payment.id, schoolId]
        );

        if (lockedPaymentResult.rows.length !== 1) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "The subscription payment could not be found.",
            });
        }

        const lockedPayment = lockedPaymentResult.rows[0];

        if (lockedPayment.status === "success") {
            await client.query("COMMIT");

            return res.status(200).json({
                message: "This payment has already been verified.",
                already_processed: true,
            });
        }

        if (lockedPayment.status !== "pending") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "This payment is no longer awaiting verification.",
            });
        }

        const subscriptionResult = await client.query(
            `
            SELECT id, status, end_date
            FROM subscriptions
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [lockedPayment.subscription_id, schoolId]
        );

        if (subscriptionResult.rows.length !== 1) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "The associated school subscription could not be found.",
            });
        }

        const subscription = subscriptionResult.rows[0];

        if (
            !["trial", "active", "expired"].includes(
                subscription.status
            )
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "This subscription cannot currently be activated or renewed.",
            });
        }

        const settingsResult = await client.query(
            `
            SELECT grace_period_days
            FROM platform_billing_settings
            WHERE singleton = TRUE;
            `
        );

        if (settingsResult.rows.length !== 1) {
            await client.query("ROLLBACK");

            return res.status(503).json({
                message: "Subscription billing settings are unavailable.",
            });
        }

        const gracePeriodDays =
            settingsResult.rows[0].grace_period_days;

       const subscriptionUpdateResult = await client.query(
        `
        WITH renewal AS (
            SELECT
                CASE
                    WHEN status = 'active'
                     AND end_date > NOW()
                    THEN end_date
                    ELSE NOW()
                END AS renewal_start
            FROM subscriptions
            WHERE id = $1
              AND school_id = $2
        )
        UPDATE subscriptions AS subscription
        SET
            status = 'active',
            billing_period = 'annual',
            price_per_student = $3,
            active_student_count = $4,
            amount = $5,
            currency = $6,
            start_date = renewal.renewal_start,
            end_date = renewal.renewal_start + INTERVAL '1 year',
            grace_period_end =
                renewal.renewal_start
                + INTERVAL '1 year'
                + ($7 * INTERVAL '1 day'),
            updated_at = NOW()
        FROM renewal
        WHERE subscription.id = $1
          AND subscription.school_id = $2
        RETURNING
            subscription.id,
            subscription.status,
            subscription.start_date,
            subscription.end_date,
            subscription.grace_period_end,
            subscription.active_student_count,
            subscription.price_per_student,
            subscription.amount,
            subscription.currency;
        `,
        [
            subscription.id,
            schoolId,
            lockedPayment.price_per_student,
            lockedPayment.active_student_count,
            lockedPayment.amount,
            lockedPayment.currency,
            gracePeriodDays,
        ]
    );

    if (subscriptionUpdateResult.rows.length !== 1) {
        throw new Error(
            "Subscription renewal did not update exactly one record."
        );
    }

    const paymentUpdateResult = await client.query(
        `
        UPDATE subscription_payments
        SET
            status = 'success',
            paid_at = NOW()
        WHERE id = $1
          AND school_id = $2
          AND status = 'pending';
        `,
        [lockedPayment.id, schoolId]
    );

    if (paymentUpdateResult.rowCount !== 1) {
        throw new Error(
            "Payment verification did not update exactly one pending payment."
        );
    }



        await client.query("COMMIT");

        return res.status(200).json({
            message: "Subscription payment verified successfully.",
            already_processed: false,
            subscription: subscriptionUpdateResult.rows[0],
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // The transaction may already have been rolled back.
        }

        throw error;
    } finally {
        client.release();
    }
} catch (error) {
    console.error(
        "Failed to verify subscription payment:",
        error.message
    );

    return res.status(500).json({
        message: "Failed to verify subscription payment.",
    });
}

};
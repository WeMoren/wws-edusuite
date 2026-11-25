import { getSubscriptionAccess } from "../services/subscriptionAccessService.js";

export const requireSubscriptionAccess = async (req, res, next) => {
    try {
        if (!req.schoolId) {
            return res.status(403).json({
                message: "School context not found.",
            });
        }

        const access = await getSubscriptionAccess(req.schoolId);

        req.subscriptionAccess = access;

        if (!access.allowed) {
            return res.status(403).json({
                code: "SUBSCRIPTION_RESTRICTED",
                message:
                    "Your school's subscription grace period has ended. Renew your subscription to restore operational access.",
                subscriptionAccess: access,
            });
        }

        return next();
    } catch (error) {
        console.error(
            "Subscription access check failed:",
            error.message
        );

        return res.status(error.statusCode || 503).json({
            code: error.code || "SUBSCRIPTION_ACCESS_UNAVAILABLE",
            message:
                error.statusCode === 503
                    ? error.message
                    : "Unable to verify subscription access.",
        });
    }
};

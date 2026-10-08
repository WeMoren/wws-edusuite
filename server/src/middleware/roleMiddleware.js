export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        const user = req.user || {};

        const userRoles = Array.isArray(user.roles)
            ? user.roles
            : user.role
                ? [user.role]
                : [];

        if (userRoles.length === 0) {
            return res.status(403).json({
                message: "User role not found.",
            });
        }

        if (!userRoles.includes(requiredRole)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action.",
            });
        }

        next();
    };
};
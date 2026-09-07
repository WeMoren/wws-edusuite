export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        const { role } = req.user || {};

        if (!role) {
            return res.status(403).json({
                message: "User role not found.",
            });
        }

        if (role !== requiredRole) {
            return res.status(403).json({
                message: "You do not have permission to perform this action.",
            });
        }

        next();
    };
};
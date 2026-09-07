export const requireSchoolContext = (req, res, next) => {
    const { schoolId } = req.user || {};

    if (!schoolId) {
        return res.status(403).json({
            message: "School context not found.",
        });
    }

    req.schoolId = schoolId;

    next();
};
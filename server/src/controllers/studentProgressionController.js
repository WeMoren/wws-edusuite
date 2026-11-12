import {
    StudentProgressionError,
    prepareStudentProgression,
    previewStudentProgression,
    processStudentProgression,
    getStudentProgressionHistory,
} from "../services/studentProgressionService.js";

const handleProgressionError = (res, error, operation) => {
    if (error instanceof StudentProgressionError) {
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details,
        });
    }

    console.error(
        `Failed to ${operation}:`,
        error.message
    );

    return res.status(500).json({
        message: `Failed to ${operation}.`,
    });
};

export const prepareProgression = async (req, res) => {
    try {
        const result = await prepareStudentProgression({
            schoolId: req.schoolId,
            sourceAcademicSessionId:
                req.query.sourceAcademicSessionId,
            destinationAcademicSessionId:
                req.query.destinationAcademicSessionId || null,
        });

        return res.status(200).json(result);
    } catch (error) {
        return handleProgressionError(
            res,
            error,
            "prepare student progression"
        );
    }
};

export const previewProgression = async (req, res) => {
    try {
        const {
            sourceAcademicSessionId,
            destinationAcademicSessionId,
            studentProgressions,
        } = req.body;

        const result = await previewStudentProgression({
            schoolId: req.schoolId,
            sourceAcademicSessionId,
            destinationAcademicSessionId,
            studentProgressions,
        });

        return res.status(200).json(result);
    } catch (error) {
        return handleProgressionError(
            res,
            error,
            "preview student progression"
        );
    }
};

export const processProgression = async (req, res) => {
    try {
        const {
            sourceAcademicSessionId,
            destinationAcademicSessionId,
            studentProgressions,
        } = req.body;

        const result = await processStudentProgression({
            schoolId: req.schoolId,
            userId: req.user?.userId,
            sourceAcademicSessionId,
            destinationAcademicSessionId,
            studentProgressions,
        });

        return res.status(200).json(result);
    } catch (error) {
        return handleProgressionError(
            res,
            error,
            "process student progression"
        );
    }
};

export const getProgressionHistory = async (req, res) => {
    try {
        const result = await getStudentProgressionHistory({
            schoolId: req.schoolId,
            page: req.query.page,
            limit: req.query.limit,
        });

        return res.status(200).json(result);
    } catch (error) {
        return handleProgressionError(
            res,
            error,
            "fetch student progression history"
        );
    }
};

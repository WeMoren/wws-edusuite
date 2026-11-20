
import {
    StudentPromotionCriteriaManagementError,
    getStudentPromotionCriteriaSupportingData,
    getStudentPromotionCriteriaConfigurations,
    createStudentPromotionCriteria,
    createStudentPromotionCriteriaVersion,
    updateStudentPromotionCriteriaDraft,
    sealStudentPromotionCriteriaVersion,
    setStudentPromotionCriteriaActivation,
} from "../services/studentPromotionCriteriaManagementService.js";

const handlePromotionCriteriaError = (
    res,
    error,
    operation
) => {
    if (
        error instanceof StudentPromotionCriteriaManagementError
    ) {
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

export const getPromotionCriteriaSupportingData = async (
    req,
    res
) => {
    try {
        const result =
            await getStudentPromotionCriteriaSupportingData(
                req.schoolId
            );

        return res.status(200).json(result);
    } catch (error) {
        return handlePromotionCriteriaError(
            res,
            error,
            "load promotion criteria supporting data"
        );
    }
};

export const getPromotionCriteriaConfigurations = async (
    req,
    res
) => {
    try {
        const result =
            await getStudentPromotionCriteriaConfigurations(
                req.schoolId
            );

        return res.status(200).json(result);
    } catch (error) {
        return handlePromotionCriteriaError(
            res,
            error,
            "load promotion criteria configurations"
        );
    }
};

export const createPromotionCriteria = async (
    req,
    res
) => {
    try {
        const {
            academicLevelId,
            minimumSessionAverage,
            subjectPassMark,
            minimumSubjectsPassed,
            termDisplayOrders,
            subjectIds,
        } = req.body || {};

        const result = await createStudentPromotionCriteria({
            schoolId: req.schoolId,
            userId: req.user?.userId,
            academicLevelId,
            minimumSessionAverage,
            subjectPassMark,
            minimumSubjectsPassed,
            termDisplayOrders,
            subjectIds,
        });

        return res.status(201).json(result);
    } catch (error) {
        return handlePromotionCriteriaError(
            res,
            error,
            "create promotion criteria"
        );
    }
};

export const createPromotionCriteriaVersion = async (
    req,
    res
) => {
    try {
        const result =
            await createStudentPromotionCriteriaVersion({
                schoolId: req.schoolId,
                userId: req.user?.userId,
                criteriaId: req.params.criteriaId,
            });

        return res.status(201).json(result);
    } catch (error) {
        return handlePromotionCriteriaError(
            res,
            error,
            "create promotion criteria draft version"
        );
    }
};

export const updatePromotionCriteriaDraft = async (
    req,
    res
) => {
    try {
        const {
            minimumSessionAverage,
            subjectPassMark,
            minimumSubjectsPassed,
            termDisplayOrders,
            subjectIds,
        } = req.body || {};

        const result =
            await updateStudentPromotionCriteriaDraft({
                schoolId: req.schoolId,
                userId: req.user?.userId,
                criteriaId: req.params.criteriaId,
                versionId: req.params.versionId,
                minimumSessionAverage,
                subjectPassMark,
                minimumSubjectsPassed,
                termDisplayOrders,
                subjectIds,
            });

        return res.status(200).json(result);
    } catch (error) {
        return handlePromotionCriteriaError(
            res,
            error,
            "update promotion criteria draft"
        );
    }
};

export const sealPromotionCriteriaVersion = async (
    req,
    res
) => {
    try {
        const result =
            await sealStudentPromotionCriteriaVersion({
                schoolId: req.schoolId,
                userId: req.user?.userId,
                criteriaId: req.params.criteriaId,
                versionId: req.params.versionId,
            });

        return res.status(200).json(result);
    } catch (error) {
        return handlePromotionCriteriaError(
            res,
            error,
            "seal promotion criteria version"
        );
    }
};

export const setPromotionCriteriaActivation = async (
    req,
    res
) => {
    try {
        const { isActive } = req.body || {};

        const result =
            await setStudentPromotionCriteriaActivation({
                schoolId: req.schoolId,
                userId: req.user?.userId,
                criteriaId: req.params.criteriaId,
                isActive,
            });

        return res.status(200).json(result);
    } catch (error) {
        return handlePromotionCriteriaError(
            res,
            error,
            "update promotion criteria activation"
        );
    }
};

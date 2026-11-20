
import express from "express";

import {
    getPromotionCriteriaSupportingData,
    getPromotionCriteriaConfigurations,
    createPromotionCriteria,
    createPromotionCriteriaVersion,
    updatePromotionCriteriaDraft,
    sealPromotionCriteriaVersion,
    setPromotionCriteriaActivation,
} from "../controllers/studentPromotionCriteriaController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.use(authenticateToken, requireSchoolContext);

// Read promotion criteria configurations and supporting data.
router.get(
    "/",
    requirePermission("studentPromotionCriteria", "view"),
    getPromotionCriteriaConfigurations
);

router.get(
    "/supporting-data",
    requirePermission("studentPromotionCriteria", "view"),
    getPromotionCriteriaSupportingData
);

// Create a school-wide or academic-level configuration.
router.post(
    "/",
    requirePermission("studentPromotionCriteria", "create"),
    createPromotionCriteria
);

// Create a new editable draft from the latest sealed version.
router.post(
    "/:criteriaId/versions",
    requirePermission("studentPromotionCriteria", "create"),
    createPromotionCriteriaVersion
);

// Update an existing unsealed draft.
router.put(
    "/:criteriaId/versions/:versionId",
    requirePermission("studentPromotionCriteria", "edit"),
    updatePromotionCriteriaDraft
);

// Seal a draft version permanently.
router.post(
    "/:criteriaId/versions/:versionId/seal",
    requirePermission("studentPromotionCriteria", "edit"),
    sealPromotionCriteriaVersion
);

// Explicitly activate or deactivate a configuration.
router.patch(
    "/:criteriaId/activation",
    requirePermission("studentPromotionCriteria", "edit"),
    setPromotionCriteriaActivation
);

export default router;

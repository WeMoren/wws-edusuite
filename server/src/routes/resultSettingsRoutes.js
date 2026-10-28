import express from "express";

import {
    getResultSettings,
    updateAssessmentSettings,
    createGradingRule,
    updateGradingRule,
    deleteGradingRule,
} from "../controllers/resultSettingsController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.use(authenticateToken, requireSchoolContext);

router.get(
    "/",
    requirePermission("academicSetup", "view"),
    getResultSettings
);

router.patch(
    "/assessment",
    requirePermission("academicSetup", "edit"),
    updateAssessmentSettings
);

router.post(
    "/grading-scales",
    requirePermission("academicSetup", "create"),
    createGradingRule
);

router.patch(
    "/grading-scales/:id",
    requirePermission("academicSetup", "edit"),
    updateGradingRule
);

router.delete(
    "/grading-scales/:id",
    requirePermission("academicSetup", "delete"),
    deleteGradingRule
);

export default router;

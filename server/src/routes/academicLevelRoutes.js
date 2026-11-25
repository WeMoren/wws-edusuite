import express from "express";

import {
    getAcademicLevels,
    getAcademicLevelById,
    createAcademicLevel,
    updateAcademicLevel,
    reorderAcademicLevels,
    deleteAcademicLevel,

} from "../controllers/academicLevelController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "view"),
    getAcademicLevels
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "view"),
    getAcademicLevelById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "create"),
    createAcademicLevel
);

router.patch(
    "/reorder",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "edit"),
    reorderAcademicLevels
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "edit"),
    updateAcademicLevel
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "delete"),
    deleteAcademicLevel
);

export default router;
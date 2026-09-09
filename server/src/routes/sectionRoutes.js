import express from "express";

import {
    getSections,
    getSectionById,
    createSection,
    updateSection,
    deleteSection,
} from "../controllers/sectionController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "view"),
    getSections
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "view"),
    getSectionById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "create"),
    createSection
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "edit"),
    updateSection
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "delete"),
    deleteSection
);

export default router;
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
    requirePermission("sections", "view"),
    getSections
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("sections", "view"),
    getSectionById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("sections", "create"),
    createSection
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("sections", "edit"),
    updateSection
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("sections", "delete"),
    deleteSection
);

export default router;
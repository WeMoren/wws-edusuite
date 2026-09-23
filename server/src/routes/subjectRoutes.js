import express from "express";

import {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
} from "../controllers/subjectController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "view"),
    getSubjects
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "view"),
    getSubjectById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "create"),
    createSubject
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "edit"),
    updateSubject
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "delete"),
    deleteSubject
);

export default router;
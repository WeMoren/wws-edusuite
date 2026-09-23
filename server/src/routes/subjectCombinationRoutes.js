
import express from "express";
import {
    getSubjectCombinations,
    getSubjectCombinationById,
    createSubjectCombination,
    updateSubjectCombination,
    deleteSubjectCombination,
} from "../controllers/subjectCombinationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "view"),
    getSubjectCombinations
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "view"),
    getSubjectCombinationById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "create"),
    createSubjectCombination
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "edit"),
    updateSubjectCombination
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("academicSetup", "delete"),
    deleteSubjectCombination
);

export default router;

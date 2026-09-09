import express from "express";

import {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
} from "../controllers/enrollmentController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "view"),
    getEnrollments
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "view"),
    getEnrollmentById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "create"),
    createEnrollment
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "edit"),
    updateEnrollment
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "delete"),
    deleteEnrollment
);

export default router;
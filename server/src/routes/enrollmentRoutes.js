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
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("students", "view"),
    getEnrollments
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("students", "view"),
    getEnrollmentById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("students", "create"),
    createEnrollment
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("students", "edit"),
    updateEnrollment
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("students", "delete"),
    deleteEnrollment
);

export default router;
import express from "express";

import {
    getAttendance,
    getAttendanceById,
    createAttendanceBatch,
    updateAttendance,
    deleteAttendance,
} from "../controllers/attendanceController.js";

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
    requirePermission("attendance", "view"),
    getAttendance
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("attendance", "view"),
    getAttendanceById
);

router.post(
    "/batch",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("attendance", "create"),
    createAttendanceBatch
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("attendance", "edit"),
    updateAttendance
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("attendance", "delete"),
    deleteAttendance
);

export default router;
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
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("attendance", "view"),
    getAttendance
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("attendance", "view"),
    getAttendanceById
);

router.post(
    "/batch",
    authenticateToken,
    requireSchoolContext,
    requirePermission("attendance", "create"),
    createAttendanceBatch
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("attendance", "edit"),
    updateAttendance
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("attendance", "delete"),
    deleteAttendance
);

export default router;
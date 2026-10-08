import express from "express";

import {
    getStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    reactivateStaff,
} from "../controllers/staffController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("staff", "view"),
    getStaff
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("staff", "view"),
    getStaffById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("staff", "create"),
    createStaff
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("staff", "edit"),
    updateStaff
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("staff", "delete"),
    deleteStaff
);

router.patch(
    "/:id/reactivate",
    authenticateToken,
    requireSchoolContext,
    requirePermission("staff", "edit"),
    reactivateStaff
);

export default router;

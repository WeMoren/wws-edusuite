import express from "express";

import {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
} from "../controllers/teacherController.js";

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
    requirePermission("teachers", "view"),
    getTeachers
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("teachers", "view"),
    getTeacherById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("teachers", "create"),
    createTeacher
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("teachers", "edit"),
    updateTeacher
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("teachers", "delete"),
    deleteTeacher
);

export default router;
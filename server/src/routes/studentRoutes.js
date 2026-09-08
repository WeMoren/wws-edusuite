import express from "express";

import {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} from "../controllers/studentController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "view"),
    getStudents
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "view"),
    getStudentById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "create"),
    createStudent
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "edit"),
    updateStudent
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "delete"),
    deleteStudent
);

export default router;

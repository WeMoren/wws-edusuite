import express from "express";

import {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
} from "../controllers/classController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("classes", "view"),
    getClasses
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("classes", "view"),
    getClassById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("classes", "create"),
    createClass
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("classes", "edit"),
    updateClass
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("classes", "delete"),
    deleteClass
);

export default router;
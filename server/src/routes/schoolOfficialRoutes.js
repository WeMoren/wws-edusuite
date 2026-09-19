import express from "express";
import {
    getSchoolOfficials,
    getSchoolOfficial,
    createSchoolOfficial,
    updateSchoolOfficial,
    deleteSchoolOfficial
} from "../controllers/schoolOfficialController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("settings", "view"),
    getSchoolOfficials
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("settings", "view"),
    getSchoolOfficial
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("settings", "create"),
    createSchoolOfficial
);

router.put(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("settings", "edit"),
    updateSchoolOfficial
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("settings", "delete"),
    deleteSchoolOfficial
);

export default router;
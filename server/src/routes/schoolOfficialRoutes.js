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
import {
    requirePermission,
    requireAnyPermission,
} from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
   requireAnyPermission(
    { resource: "settings", action: "view" },
    { resource: "result_document_settings", action: "view" }
),
    getSchoolOfficials
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
   requireAnyPermission(
    { resource: "settings", action: "view" },
    { resource: "result_document_settings", action: "view" }
),
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
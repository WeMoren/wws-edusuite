import express from "express";
import {
    getSchoolProfile,
    updateSchoolProfile,
} from "../controllers/schoolProfileController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import {
    requirePermission,
    requireAnyPermission,
} from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireSchoolContext);

router.get(
    "/",
    requireAnyPermission(
    { resource: "settings", action: "view" },
    { resource: "result_document_settings", action: "view" }
),
    getSchoolProfile
);

router.put(
    "/",
    requirePermission("settings", "edit"),
    updateSchoolProfile
);

export default router;

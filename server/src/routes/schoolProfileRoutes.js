import express from "express";
import {
    getSchoolProfile,
    updateSchoolProfile,
} from "../controllers/schoolProfileController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireSchoolContext);

router.get(
    "/",
    requirePermission("settings", "view"),
    getSchoolProfile
);

router.put(
    "/",
    requirePermission("settings", "edit"),
    updateSchoolProfile
);

export default router;

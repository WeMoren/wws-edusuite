import express from "express";
import { getRecentActivities } from "../controllers/recentActivityController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("recent_activities", "view"),
    getRecentActivities
);

export default router;

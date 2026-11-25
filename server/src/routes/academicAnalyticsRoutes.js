import express from "express";

import {
    getAcademicAnalyticsPeriods,
    getAcademicPerformance,
} from "../controllers/academicAnalyticsController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requireAcademicAnalyticsAccess } from "../middleware/academicAnalyticsMiddleware.js";

const router = express.Router();

router.get(
    "/periods",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireAcademicAnalyticsAccess,
    getAcademicAnalyticsPeriods
);

router.get(
    "/academic-performance",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireAcademicAnalyticsAccess,
    getAcademicPerformance
);

export default router;
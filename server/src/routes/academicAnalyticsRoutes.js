import express from "express";

import {
    getAcademicAnalyticsPeriods,
    getAcademicPerformance,
} from "../controllers/academicAnalyticsController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireAcademicAnalyticsAccess } from "../middleware/academicAnalyticsMiddleware.js";

const router = express.Router();

router.get(
    "/periods",
    authenticateToken,
    requireSchoolContext,
    requireAcademicAnalyticsAccess,
    getAcademicAnalyticsPeriods
);

router.get(
    "/academic-performance",
    authenticateToken,
    requireSchoolContext,
    requireAcademicAnalyticsAccess,
    getAcademicPerformance
);

export default router;
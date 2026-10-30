import express from "express";

import { getFinancialSummary } from "../controllers/financialSummaryController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "view"),
    getFinancialSummary
);

export default router;

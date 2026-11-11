import express from "express";

import {
    getStudentFinancialAccounts,
    getStudentFinancialAccountById,
    createStudentFinancialAccount,
    getStudentPaymentStatuses,
    generateCurrentTermFinancialAccounts,
} from "../controllers/studentFinancialAccountController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// Status-only access for users who can view Students.
// Does not expose financial amounts or payment history.
router.get(
    "/payment-statuses",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "view"),
    getStudentPaymentStatuses
);

// Generate financial accounts for the current academic session and term.
router.post(
    "/generate-current-term",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "create"),
    generateCurrentTermFinancialAccounts
);

// Full financial account access remains restricted to Accountant permissions.
router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "view"),
    getStudentFinancialAccounts
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "view"),
    getStudentFinancialAccountById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "create"),
    createStudentFinancialAccount
);

export default router;
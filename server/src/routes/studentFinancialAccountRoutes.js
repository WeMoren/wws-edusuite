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
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// Status-only access for users who can view Students.
// Does not expose financial amounts or payment history.
router.get(
    "/payment-statuses",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("students", "view"),
    getStudentPaymentStatuses
);

// Generate financial accounts for the current academic session and term.
router.post(
    "/generate-current-term",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "create"),
    generateCurrentTermFinancialAccounts
);

// Full financial account access remains restricted to Accountant permissions.
router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "view"),
    getStudentFinancialAccounts
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "view"),
    getStudentFinancialAccountById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "create"),
    createStudentFinancialAccount
);

export default router;
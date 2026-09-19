import express from "express";

import {
    getStudentFinancialAccounts,
    getStudentFinancialAccountById,
    createStudentFinancialAccount,
} from "../controllers/studentFinancialAccountController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

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
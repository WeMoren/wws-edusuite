import express from "express";

import {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
} from "../controllers/expenseController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// All routes require authentication and school context
router.use(authenticateToken);
router.use(requireSchoolContext);

// GET all expenses
router.get(
    "/",
    requirePermission("accountant", "view"),
    getExpenses
);

// GET one expense
router.get(
    "/:id",
    requirePermission("accountant", "view"),
    getExpenseById
);

// CREATE expense
router.post(
    "/",
    requirePermission("accountant", "create"),
    createExpense
);

// UPDATE expense
router.patch(
    "/:id",
    requirePermission("accountant", "edit"),
    updateExpense
);

export default router;
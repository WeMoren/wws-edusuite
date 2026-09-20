
import express from "express";

import {
    getExpenseCategories,
    getExpenseCategoryById,
    createExpenseCategory,
    updateExpenseCategory,
} from "../controllers/expenseCategoryController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// All routes require authentication and school context
router.use(authenticateToken);
router.use(requireSchoolContext);

// GET all expense categories
router.get(
    "/",
    requirePermission("accountant", "view"),
    getExpenseCategories
);

// GET one expense category
router.get(
    "/:id",
    requirePermission("accountant", "view"),
    getExpenseCategoryById
);

// CREATE expense category
router.post(
    "/",
    requirePermission("accountant", "create"),
    createExpenseCategory
);

// UPDATE expense category
router.patch(
    "/:id",
    requirePermission("accountant", "edit"),
    updateExpenseCategory
);

export default router;
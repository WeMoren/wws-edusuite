import express from "express";

import {
    getPayments,
    getPaymentById,
    createPayment,
} from "../controllers/paymentController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "view"),
    getPayments
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "create"),
    createPayment
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("accountant", "view"),
    getPaymentById
);

export default router;
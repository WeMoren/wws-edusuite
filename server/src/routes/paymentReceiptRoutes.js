import express from "express";

import {
    getPaymentReceipt,
} from "../controllers/paymentReceiptController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/:paymentId",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "view"),
    getPaymentReceipt
);

export default router;
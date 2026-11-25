import express from "express";

import {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
     getPaymentCorrectionHistory,
} from "../controllers/paymentController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";


const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "view"),
    getPayments
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "create"),
    createPayment
);

router.get(
    "/:id/corrections",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    getPaymentCorrectionHistory
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("accountant", "view"),
    getPaymentById
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    updatePayment
);


export default router;
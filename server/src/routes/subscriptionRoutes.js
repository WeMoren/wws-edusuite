import express from "express";

import {
    getSchoolSubscription,
    createSchoolSubscription,
    getSubscriptionPayments,
    activateOrRenewSchoolSubscription
} from "../controllers/subscriptionController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

import { requireSchoolContext } from "../middleware/schoolMiddleware.js";

import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    getSchoolSubscription
);

router.get(
    "/payments",
    authenticateToken,
    requireSchoolContext,
    getSubscriptionPayments
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireRole("Admin"),
    createSchoolSubscription
);

router.post(
    "/activate-renew",
    authenticateToken,
    requireSchoolContext,
    requireRole("Admin"),
    activateOrRenewSchoolSubscription
);

export default router;
import express from "express";

import {
getSchoolSubscription,
getSubscriptionPayments,
getSchoolSubscriptionQuote,
initializeSchoolSubscriptionPayment,
verifySchoolSubscriptionPayment,
} from "../controllers/subscriptionController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

const billingRoles = ["Principal", "School Admin"];

router.use(
authenticateToken,
requireSchoolContext,
requireRole(billingRoles)
);

router.get("/", getSchoolSubscription);

router.get("/quote", getSchoolSubscriptionQuote);

router.get("/payments", getSubscriptionPayments);

router.post(
"/initialize-payment",
initializeSchoolSubscriptionPayment
);

router.post(
"/verify-payment",
verifySchoolSubscriptionPayment
);

export default router;

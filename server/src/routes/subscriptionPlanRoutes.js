import express from "express";
import {
    getSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
} from "../controllers/subscriptionPlanController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getSubscriptionPlans);


router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireRole("Admin"),
    createSubscriptionPlan
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireRole("Admin"),
    createSubscriptionPlan
);


router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireRole("Admin"),
    updateSubscriptionPlan
);

export default router;
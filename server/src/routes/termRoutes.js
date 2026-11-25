import express from "express";

import {
    getTerms,
    getTermById,
    createTerm,
    updateTerm,
    deleteTerm,
} from "../controllers/termController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "view"),
    getTerms
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "view"),
    getTermById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "create"),
    createTerm
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "edit"),
    updateTerm
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "delete"),
    deleteTerm
);

export default router;
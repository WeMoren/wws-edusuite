import express from "express";

import {
    getFeeStructures,
    getFeeStructureById,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
} from "../controllers/feeStructureController.js";

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
    requirePermission("feeStructures", "view"),
    getFeeStructures
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("feeStructures", "view"),
    getFeeStructureById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("feeStructures", "create"),
    createFeeStructure
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("feeStructures", "edit"),
    updateFeeStructure
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("feeStructures", "delete"),
    deleteFeeStructure
);

export default router;
import express from "express";
import {
    getStreams,
    getStreamById,
    createStream,
    updateStream,
    deleteStream,
} from "../controllers/streamController.js";
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
    getStreams
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "view"),
    getStreamById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "create"),
    createStream
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "edit"),
    updateStream
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("academicSetup", "delete"),
    deleteStream
);

export default router;

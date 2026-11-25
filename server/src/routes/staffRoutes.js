
import express from "express";

import {
    getStaff,
    getStaffCount,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    reactivateStaff,
    getStaffPositions,
    getStaffInvitationStatuses,
} from "../controllers/staffController.js";

import {
    createStaffInvitation,
    acceptStaffInvitation,
} from "../controllers/staffInvitationController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
 * Staff account setup is restricted to Principals.
 * Authentication and school context are still required.
 */

// Read-only staff catalogue and invitation statuses.
router.get(
    "/positions",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    getStaffPositions
);

router.get(
    "/invitations/status",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    getStaffInvitationStatuses
);

// Public invitation acceptance: the invitee must not need an existing login.
router.post(
    "/invitations/accept",
    acceptStaffInvitation
);

// Staff management.
router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    requirePermission("staff", "view"),
    getStaff
);

router.get(
    "/count",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("staff", "view"),
    getStaffCount
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    requirePermission("staff", "view"),
    getStaffById
);

router.post(
    "/:id/invitation",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    requirePermission("staff", "invite"),
    createStaffInvitation
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    requirePermission("staff", "create"),
    createStaff
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    requirePermission("staff", "edit"),
    updateStaff
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    requirePermission("staff", "delete"),
    deleteStaff
);

router.patch(
    "/:id/reactivate",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requireRole("Principal"),
    requirePermission("staff", "edit"),
    reactivateStaff
);

export default router;

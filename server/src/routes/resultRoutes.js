import express from "express";

import {
    getResults,
    getResultById,
    getResultRankings,
    getSessionResultRankings,
    createResult,
    updateResult,
    deleteResult,
} from "../controllers/resultController.js";

import {
    createResultDocument,
    getResultDocumentById,
    getResultDocumentStatuses,
    finalizeResultDocument,
    authorizeResultDocumentAsPrincipal,
    authorizeResultDocumentAsExamOfficer
} from "../controllers/resultDocumentController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSubscriptionAccess } from "../middleware/subscriptionAccessMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "view"),
    getResults
);

router.post(
    "/documents",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "create"),
    createResultDocument
);

router.get(
    "/documents/lookup",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "view"),
    getResultDocumentStatuses
);

router.get(
    "/documents/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "view"),
    getResultDocumentById
);

router.post(
    "/documents/:id/authorize/principal",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "authorize"),
    authorizeResultDocumentAsPrincipal
);

router.post(
    "/documents/:id/authorize/exam-officer",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "authorize"),
    authorizeResultDocumentAsExamOfficer
);

router.post(
    "/documents/:id/finalize",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "edit"),
    finalizeResultDocument
);

router.get(
    "/rankings",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "view"),
    getResultRankings
);

router.get(
    "/session-rankings",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "view"),
    getSessionResultRankings
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "view"),
    getResultById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "create"),
    createResult
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "edit"),
    updateResult
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requireSubscriptionAccess,
    requirePermission("results", "delete"),
    deleteResult
);

export default router;
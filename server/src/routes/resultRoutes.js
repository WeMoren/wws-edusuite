import express from "express";

import {
    getResults,
    getResultById,
    createResult,
    updateResult,
    deleteResult,
} from "../controllers/resultController.js";

import {
    createResultDocument,
    getResultDocumentById,
    finalizeResultDocument
} from "../controllers/resultDocumentController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "view"),
    getResults
);

router.post(
    "/documents",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "create"),
    createResultDocument
);

router.get(
    "/documents/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "view"),
    getResultDocumentById
);

router.post(
    "/documents/:id/finalize",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "edit"),
    finalizeResultDocument
);

router.get(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "view"),
    getResultById
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "create"),
    createResult
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "edit"),
    updateResult
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("results", "delete"),
    deleteResult
);

export default router;
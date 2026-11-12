import express from "express";

import {
    prepareProgression,
    previewProgression,
    processProgression,
    getProgressionHistory,
} from "../controllers/studentProgressionController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.use(
    authenticateToken,
    requireSchoolContext
);

router.get(
    "/prepare",
    requirePermission("studentProgression", "view"),
    prepareProgression
);

router.get(
    "/history",
    requirePermission("studentProgression", "view"),
    getProgressionHistory
);

router.post(
    "/preview",
    requirePermission("studentProgression", "create"),
    previewProgression
);

router.post(
    "/process",
    requirePermission("studentProgression", "edit"),
    processProgression
);

export default router;

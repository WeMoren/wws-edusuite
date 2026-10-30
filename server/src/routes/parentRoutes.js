import express from "express";

import {
    getParents,
    getParentById,
    createParent,
    updateParent,
    deleteParent,
} from "../controllers/parentController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.use(authenticateToken, requireSchoolContext);

router.get(
    "/",
    requirePermission("parents", "view"),
    getParents
);

router.get(
    "/:id",
    requirePermission("parents", "view"),
    getParentById
);

router.post(
    "/",
    requirePermission("parents", "create"),
    createParent
);

router.patch(
    "/:id",
    requirePermission("parents", "edit"),
    updateParent
);

router.delete(
    "/:id",
    requirePermission("parents", "delete"),
    deleteParent
);

export default router;

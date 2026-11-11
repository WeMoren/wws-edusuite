import express from "express";
import {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} from "../controllers/eventController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("events", "view"),
    getEvents
);

router.post(
    "/",
    authenticateToken,
    requireSchoolContext,
    requirePermission("events", "create"),
    createEvent
);

router.patch(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("events", "edit"),
    updateEvent
);

router.delete(
    "/:id",
    authenticateToken,
    requireSchoolContext,
    requirePermission("events", "delete"),
    deleteEvent
);

export default router;

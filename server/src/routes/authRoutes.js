import express from "express";
import { registerUser, loginUser, registerSchool } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import rateLimit from "express-rate-limit";
import {
    requestPasswordReset,
    resetPassword,
} from "../controllers/passwordRecoveryController.js";


const router = express.Router();

router.post("/register", 
     authenticateToken,
    requireSchoolContext,
    requireRole("Admin"), 
    registerUser
);
router.post("/login", loginUser);
router.post("/register-school", registerSchool);



const passwordResetRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many password-reset requests. Please try again later.",
    },
});

const passwordResetSubmitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many reset attempts. Please try again later.",
    },
});

router.post(
    "/forgot-password",
    passwordResetRequestLimiter,
    requestPasswordReset
);

router.post(
    "/reset-password",
    passwordResetSubmitLimiter,
    resetPassword
);



router.get("/me", authenticateToken, requireSchoolContext, (req, res) => {
    return res.status(200).json({
        message: "Authenticated request successful.",
        user: req.user,
        schoolId: req.schoolId,
    });
});


router.get(
    "/permission-test",
    authenticateToken,
    requireSchoolContext,
    requirePermission("students", "create"),
    (req, res) => {
        return res.status(200).json({
            message: "Permission granted.",
            permission: "students.create",
            role: req.user.role,
        });
    }
);


export default router;
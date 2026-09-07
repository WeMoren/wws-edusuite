import express from "express";
import { registerUser, loginUser, registerSchool } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { requireSchoolContext } from "../middleware/schoolMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", 
     authenticateToken,
    requireSchoolContext,
    requireRole("Admin"), 
    registerUser
);
router.post("/login", loginUser);
router.post("/register-school", registerSchool);


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
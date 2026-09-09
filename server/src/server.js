import dotenv from "dotenv";
dotenv.config();

import express from "express";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionPlanRoutes from "./routes/subscriptionPlanRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import academicSessionRoutes from "./routes/academicSessionRoutes.js";
import academicLevelRoutes from "./routes/academicLevelRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/subscription-plans", subscriptionPlanRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/academic-levels", academicLevelRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/academic-sessions", academicSessionRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.json({
        message:"WWS-EduSuite API is running",
    });
});

pool.query("SELECT NOW()")
    .then(() => {
        console.log("PostgreSQL database connected");
    })
    .catch((error) => {
        console.error("PostgreSQL connection failed:", error.message);
    });

app.listen(PORT, ()  => {
    console.log(`WWS-Edusuite is running on port ${PORT}`)
})


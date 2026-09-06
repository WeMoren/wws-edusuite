import dotenv from "dotenv";
dotenv.config();

import express from "express";
import pool from "./config/db.js";


const app = express();
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


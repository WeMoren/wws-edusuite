import express from "express";
const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.json({
        message:"WWS-EduSuite API is running",
    });
});

app.listen(PORT, ()  => {
    console.log(`WWS-Edusuite is running on port ${PORT}`)
})
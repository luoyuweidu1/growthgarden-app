import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// API routes
app.get("/", (_req, res) => {
  res.json({ 
    message: "Growth Garden API is working!",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server listening on port ${port}`);
});
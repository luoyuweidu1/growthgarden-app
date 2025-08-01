import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

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

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server listening on port ${port}`);
});
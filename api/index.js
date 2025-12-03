// api/index.js
import "dotenv/config";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Hello from Vercel" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Test route" });
});

export default app;
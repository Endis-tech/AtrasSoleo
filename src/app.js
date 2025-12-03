// src/app.js - VERSIÓN SIN CONEXIÓN INMEDIATA
import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

console.log("📦 Cargando Express app...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Ruta de salud - SIN conexión a DB
app.get("/", (_req, res) => res.json({ 
  ok: true, 
  name: "soleo-pwa-api",
  status: "running",
  timestamp: new Date().toISOString()
}));

// Ruta de prueba de DB
app.get("/health", async (req, res) => {
  try {
    // Conexión a DB solo cuando se solicita
    const { connectToDB } = await import("./db/connect.js");
    await connectToDB();
    res.json({ 
      status: "healthy", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware para conexión a DB en rutas específicas
app.use(async (req, res, next) => {
  // Solo conectar a DB para rutas API
  if (req.path.startsWith('/api/')) {
    try {
      const { connectToDB } = await import("./db/connect.js");
      await connectToDB();
      next();
    } catch (error) {
      console.error("❌ DB connection error:", error);
      res.status(500).json({ 
        error: "Database connection failed",
        message: process.env.NODE_ENV === 'production' ? 'Internal error' : error.message 
      });
    }
  } else {
    next();
  }
});

// Importar y usar rutas DINÁMICAMENTE (no al inicio)
app.use("/api/auth", async (req, res, next) => {
  try {
    const authRoutes = (await import("./routes/auth.routes.js")).default;
    return authRoutes(req, res, next);
  } catch (error) {
    console.error("❌ Error cargando auth routes:", error);
    res.status(500).json({ error: "Failed to load auth routes" });
  }
});

// Repite para otras rutas según sea necesario...

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

console.log("✅ Express app configurada");

export default app;
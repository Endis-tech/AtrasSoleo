// api/index.js
import "dotenv/config";
import app from "../src/app.js";

// Agrega una ruta de prueba simple
app.get("/test", (req, res) => {
  res.json({ message: "Test route" });
});

export default app;
// api/index.js - VERSIÓN CON DEBUGGING
console.log("🚀 Iniciando función en Vercel...");

try {
  // Intenta cargar dotenv primero
  import('dotenv/config').then(() => {
    console.log("✅ dotenv cargado");
  }).catch(err => {
    console.log("⚠️  dotenv no cargado:", err.message);
  });
  
  // Importa la app de Express
  import('../src/app.js').then((module) => {
    const app = module.default;
    console.log("✅ Express app importada correctamente");
    
    // Exporta la función handler
    export default function handler(req, res) {
      console.log(`📥 Request recibido: ${req.method} ${req.url}`);
      return app(req, res);
    };
  }).catch((error) => {
    console.error("❌ ERROR al importar app.js:", error);
    
    // Exporta un handler de emergencia
    export default function handler(req, res) {
      console.error("❌ App no disponible");
      res.status(500).json({
        error: "Server initialization failed",
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });
    };
  });
} catch (error) {
  console.error("❌ ERROR FATAL en api/index.js:", error);
  
  export default function handler(req, res) {
    res.status(500).json({
      error: "Fatal server error",
      message: error.message
    });
  };
}
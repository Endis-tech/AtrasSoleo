// api/index.js
import app from '../src/app.js';

export default async function handler(req, res) {
  // Para debugging, puedes agregar logs
  console.log(`${req.method} ${req.url}`);
  
  // Pasar la solicitud a Express
  return app(req, res);
}
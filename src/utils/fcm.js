// src/utils/fcm.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el archivo JSON manualmente
const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Inicializar Firebase Admin solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'soleo-push-pwa'
  });
}

export async function sendFcmNotification(fcmTokens, title, body) {
  if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) return;

  const message = {
    notification: { title, body },
    tokens: fcmTokens
  };

  try {
    await admin.messaging().sendMulticast(message);
    console.log('✅ Notificación FCM enviada');
  } catch (error) {
    console.error('❌ Error al enviar FCM:', error);
  }
}
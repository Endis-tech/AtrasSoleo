// src/db/connect.js - Asegúrate de no tener código inmediato
import mongoose from "mongoose";

let isConnected = false;

export const connectToDB = async () => {
  console.log("🔗 connectToDB llamado");
  
  if (isConnected) {
    console.log("✅ Usando conexión existente a MongoDB");
    return;
  }

  try {
    console.log("📡 MONGO_URI disponible:", !!process.env.MONGO_URI);
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI no está definida");
    }

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    isConnected = true;
    console.log("✅ MongoDB conectado exitosamente");
    
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    isConnected = false;
    throw error;
  }
};

// NO exportes nada que se ejecute inmediatamente aquí
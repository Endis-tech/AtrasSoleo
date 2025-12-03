import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ==========================================
// GET CURRENT USER - PARA PROGRESO (NUEVO)
// ==========================================
export async function getCurrentUser(req, res) {
    try {
        console.log('👤 Obteniendo datos completos del usuario ID:', req.userId);
        
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "Usuario no encontrado" 
            });
        }

        console.log('📊 Datos del usuario encontrados:', {
            id: user._id,
            name: user.name,
            streak: user.streak,
            progress: user.progress,
            workouts: user.progress?.totalWorkouts || 0
        });

        // Preparar respuesta con datos para el progreso
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            membership: user.currentMembership?.name || 'Semilla',
            profilePhoto: user.profilePhoto,
            weight: user.weight,
            exerciseTime: user.exerciseTime,
            // ✅ Datos para rachas y progreso
            streak: user.streak || {
                current: 0,
                longest: 0,
                lastWorkoutDate: null
            },
            progress: user.progress || {
                totalWorkouts: 0,
                totalExerciseTime: 0,
                totalDuration: 0,
                workoutsThisWeek: 0,
                workoutsThisMonth: 0
            },
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            user: userData
        });

    } catch (error) {
        console.error('❌ Error en getCurrentUser:', error);
        res.status(500).json({ 
            success: false,
            message: "Error del servidor al obtener datos del usuario",
            error: error.message 
        });
    }
}

// ==========================================
// GET PROFILE (CLIENT)
// ==========================================
export async function getProfile(req, res) {
    try {
        const user = await User.findById(req.userId).select("-password");
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Error al obtener perfil" });
    }
}

// ==========================================
// UPDATE PROFILE (CLIENT) - VERSIÓN CORREGIDA
// ==========================================
export async function updateProfile(req, res) {
    try {
        console.log('✏️ Actualizando perfil para user ID:', req.userId);
        console.log('📦 Datos recibidos:', req.body);
        
        const { name, email, password, weight, exerciseTime, currentPassword } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "Usuario no encontrado" 
            });
        }

        // Validar contraseña actual si se quiere cambiar la contraseña
        if (password && password.trim() !== '') {
            if (!currentPassword) {
                return res.status(400).json({ 
                    success: false,
                    message: "La contraseña actual es requerida" 
                });
            }
            
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ 
                    success: false,
                    message: "La contraseña actual es incorrecta" 
                });
            }
            
            user.password = await bcrypt.hash(password, 10);
            console.log('✅ Contraseña actualizada');
        }

        // Actualizar otros campos
        if (name && name.trim() !== '') user.name = name.trim();
        if (email && email.trim() !== '') user.email = email.trim();
        if (weight !== undefined) user.weight = weight;
        if (exerciseTime !== undefined) user.exerciseTime = exerciseTime;

        await user.save();
        
        // ⭐ CORRECCIÓN: Obtener usuario sin password y sin populate problemático
        const userWithoutPassword = await User.findById(req.userId).select("-password");

        console.log('✅ Perfil actualizado correctamente para:', user.email);
        
        res.json({ 
            success: true,
            message: "Perfil actualizado correctamente", 
            user: userWithoutPassword 
        });

    } catch (err) {
        console.error('❌ Error detallado al actualizar perfil:', err);
        
        // Manejar error de email duplicado
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false,
                message: "El email ya está en uso por otro usuario" 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: "Error interno del servidor al actualizar perfil",
            error: err.message 
        });
    }
}

// ==========================================
// UPLOAD PROFILE PHOTO - VERSIÓN CORREGIDA
// ==========================================
export async function uploadProfilePhoto(req, res) {
    try {
        console.log('📸 Subiendo foto de perfil...');
        console.log('User ID:', req.userId); 
        console.log('Archivo recibido:', req.file);
        
        if (!req.file) {
            return res.status(400).json({ message: "No se subió ninguna imagen" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // ✅ CORREGIDO: Usar la nueva ruta "profile" (no "imagenes-perfil")
        const profilePhotoUrl = `/uploads/profile/${req.file.filename}`;        
        // Eliminar foto anterior si existe
        if (user.profilePhoto) {
            const oldPhotoPath = path.join(process.cwd(), user.profilePhoto);
            console.log('🗑️ Intentando eliminar foto anterior:', oldPhotoPath);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
                console.log('✅ Foto anterior eliminada');
            }
        }
        
        // Actualizar usuario
        user.profilePhoto = profilePhotoUrl;
        await user.save();

        console.log('✅ Foto actualizada para:', user.email);
        console.log('📁 Nueva foto guardada en:', profilePhotoUrl);

        const updatedUser = await User.findById(req.userId).select("-password");

        res.json({ 
            success: true,
            message: "Foto de perfil actualizada", 
            profilePhoto: profilePhotoUrl,
            user: updatedUser
        });

    } catch (error) {
        console.error('❌ Error al subir la foto:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log('🗑️ Archivo temporal eliminado por error');
        }
        
        res.status(500).json({ message: "Error al subir la foto" });
    }
}

// ==========================================
// GET ALL CLIENTS (ADMIN)
// ==========================================
export async function getAllClients(req, res) {
    try {
        const users = await User.find({ role: "CLIENTE" })
            .select("-password")
            .populate('currentMembership', 'name price durationDays status') // ✅ Campo correcto
            .populate('routines', 'name status')
            .sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ message: "Error al obtener usuarios" });
    }
}

// ==========================================
// UPDATE USER STATUS (ADMIN)
// ACTIVE | INACTIVE | SUSPENDED | DELETED
// ==========================================
export async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowed = ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Estado no válido" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        user.status = status;
        await user.save();

        res.json({ message: `Usuario actualizado a ${status}`, user });
    } catch (err) {
        res.status(500).json({ message: "Error al actualizar usuario" });
    }
}

// ==========================================
// DELETE OWN ACCOUNT (CLIENT) — ELIMINACIÓN COMPLETA
// ==========================================
export async function deleteOwnAccount(req, res) {
    try {
        console.log('=== INICIANDO ELIMINACIÓN PERMANENTE DE CUENTA ===');
        console.log('🔑 User ID:', req.userId);

        if (!req.userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        console.log('✅ Usuario encontrado:', user.email);

        // 🔥 ELIMINAR FOTO DE PERFIL SI EXISTE
        if (user.profilePhoto) {
            try {
                const fs = require('fs');
                const path = require('path');
                
                // Extraer el nombre del archivo de la URL/path
                const photoFilename = user.profilePhoto.split('/').pop();
                const photoPath = path.join(process.cwd(), 'uploads', 'profile', photoFilename);
                
                console.log('🖼️ Intentando eliminar foto:', photoPath);
                
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                    console.log('✅ Foto de perfil eliminada del servidor');
                }
            } catch (fileError) {
                console.warn('⚠️ No se pudo eliminar la foto:', fileError.message);
                // Continuar con la eliminación del usuario aunque falle la foto
            }
        }

        // 🔥 ELIMINACIÓN PERMANENTE DEL USUARIO
        console.log('🗑️ Eliminando usuario de la base de datos...');
        await User.findByIdAndDelete(req.userId);
        
        console.log('✅ Usuario eliminado permanentemente');

        res.json({
            success: true,
            message: "Cuenta eliminada permanentemente"
        });

    } catch (err) {
        console.error('❌ ERROR en deleteOwnAccount:');
        console.error('Mensaje:', err.message);
        
        res.status(500).json({ 
            success: false,
            message: "Error interno del servidor al eliminar la cuenta"
        });
    }
}

// ==========================================
// HARD DELETE (ADMIN) — DELETE USER FOREVER
// ==========================================
export async function adminHardDeleteUser(req, res) {
    try {
        const { id } = req.params;

        // Prevent self-delete
        if (req.userId === id) {
            return res.status(400).json({
                message: "Un administrador no puede eliminar su propia cuenta permanentemente"
            });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        await User.findByIdAndDelete(id);

        res.json({ message: "Usuario eliminado permanentemente" });
    } catch (err) {
        res.status(500).json({ message: "Error al eliminar usuario" });
    }
}

// ==========================================
// GET USER MEMBERSHIP
// ==========================================
export async function getUserMembership(req, res) {
    try {
        const user = await User.findById(req.userId)
            .select('currentMembership membershipExpiresAt membershipAssignedAt')
            .populate('currentMembership', 'name price durationDays'); // ✅ Campo correcto
            
        res.json({ 
            membership: user.currentMembership,
            expiresAt: user.membershipExpiresAt,
            assignedAt: user.membershipAssignedAt,
            userId: user._id 
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener membresía" });
    }
}

// ==========================================
// SAVE FCM TOKEN FOR PUSH NOTIFICATIONS
// ==========================================
export async function saveFcmToken(req, res) {
  try {
    const { fcmToken } = req.body;

    // Validación básica
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Token FCM inválido o faltante"
      });
    }

    // Agregar el token al usuario (evita duplicados con $addToSet)
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { fcmTokens: fcmToken.trim() } },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    console.log(`✅ Token FCM guardado para: ${user.email}`);
    res.json({
      success: true,
      message: "Token FCM registrado exitosamente"
    });

  } catch (error) {
    console.error('❌ Error al guardar FCM token:', error);
    res.status(500).json({
      success: false,
      message: "Error interno al registrar token de notificaciones"
    });
  }
}



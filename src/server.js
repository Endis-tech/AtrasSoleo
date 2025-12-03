import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';


// importar rutas
import authRoutes from './routes/auth.routes.js';
import membershipRoutes from "./routes/membership.routes.js";
import userRoutes from "./routes/user.routes.js";
import routineRoutes from "./routes/routine.routes.js";
import muscleGroupRoutes from "./routes/muscleGroup.routes.js"; // NUEVO
import exerciseRoutes from "./routes/exercise.routes.js"; // NUEVO
import workoutLogRoutes from "./routes/workoutLog.routes.js"; // NUEVO

// Crear la aplicación de Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ok: true, name:'soleo-pwa-api'}));


app.use('/api/auth', authRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/users", userRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/muscle-groups", muscleGroupRoutes); // NUEVO
app.use("/api/exercises", exerciseRoutes); // NUEVO
app.use('/api/workout-logs', workoutLogRoutes);

require('./jobs/sendWorkoutReminders');
require('./jobs/sendMembershipExpiryAlerts.js');



const { PORT = 4000, MONGO_URI } = process.env;

mongoose.connect(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos', err);
        process.exit(1);
    });
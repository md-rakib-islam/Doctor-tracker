import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/authenticate';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import doctorRoutes from './doctor.routes';
import patientRoutes from './patient.routes';

const router = Router();

router.get('/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: dbUp ? 'OK' : 'Database unavailable',
    data: { status: dbUp ? 'ok' : 'degraded', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);

// Everything below requires an authenticated admin.
router.use('/doctors', authenticate, doctorRoutes);
router.use('/patients', authenticate, patientRoutes);
router.use('/dashboard', authenticate, dashboardRoutes);

export default router;

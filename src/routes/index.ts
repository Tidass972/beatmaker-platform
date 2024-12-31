import { Router } from 'express';
import authRoutes from './auth.routes';
import beatRoutes from './beat.routes';
import userRoutes from './user.routes';

const router = Router();

// Routes principales de l'API
router.use('/auth', authRoutes);
router.use('/beats', beatRoutes);
router.use('/users', userRoutes);

export default router;

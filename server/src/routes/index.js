import { Router } from 'express';
import authRoutes from './authRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import adminRoutes from './adminRoutes.js';
import studentRoutes from './studentRoutes.js';
import debugRoutes from './debugRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teacher', teacherRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/debug', debugRoutes);

export default router;

import { Router } from 'express';
import { login, register } from '../controllers/authController.js';

const router = Router();
router.post('/register', register); // for student/teacher
router.post('/login', login);

export default router;

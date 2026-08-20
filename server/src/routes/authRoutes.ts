import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

// DigiLocker Sandbox Flow
router.post('/digilocker/init', authenticateJWT, AuthController.digilockerInit);
router.get('/digilocker/callback', AuthController.digilockerCallback);

// Profile
router.get('/me', authenticateJWT, AuthController.getProfile);

export default router;

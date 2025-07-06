import express from 'express';
import { loginRateLimiter, refreshRateLimiter, apiRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { AuthController } from '../controllers/auth.controller.js';

const router = express.Router();
const authController = new AuthController();

router.post('/register', authController.register.bind(authController));
router.post('/login', loginRateLimiter, authController.login.bind(authController));
router.post('/refresh', refreshRateLimiter, authController.refreshAccessToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;
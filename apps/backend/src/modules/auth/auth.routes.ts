import { Router } from 'express';
import authController from './auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { loginSchema, signupSchema } from '@healthcare/shared-utils';

const router = Router();

// Signup & Verification routes
router.post('/signup', validateBody(signupSchema), authController.signup);
router.get('/verify-email', authController.verifyEmail);

// Normal Password Auth
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Reset Passwords
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// One-Time Passwords (OTPs)
router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);

export default router;

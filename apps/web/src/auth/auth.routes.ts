import { Router } from 'express';
import { login, logout, refresh } from './auth.controller.js';

const router = Router();

/**
 * POST /auth/login - Login with email and password
 */
router.post('/login', login);

/**
 * POST /auth/refresh - Refresh access token
 */
router.post('/refresh', refresh);

/**
 * POST /auth/logout - Logout
 */
router.post('/logout', logout);

export default router;

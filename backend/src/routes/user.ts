import express from 'express';
import { validateGoogleLogin,verifyToken } from '../middleware/validate.js';

import { googleLogin, logout, getMe, refreshToken } from '../controllers/authController.js';


const router = express.Router();

router.post('/google', validateGoogleLogin, googleLogin);
router.get('/me', verifyToken, getMe);
router.post('/refresh',refreshToken)
router.post('/logout', logout);
export default router;
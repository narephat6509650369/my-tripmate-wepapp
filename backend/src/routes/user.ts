import express from 'express';
import { validateGoogleLogin,verifyToken } from '../middleware/validate.js';

import { googleLogin, logout, getMe } from '../controllers/authController.js';


const router = express.Router();

router.post('/google', validateGoogleLogin, googleLogin);
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);
export default router;
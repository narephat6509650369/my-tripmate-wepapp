import express from 'express';
import { validateGoogleLogin } from '../middleware/validate.js';
import { googleLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/google', validateGoogleLogin, googleLogin);

export default router;
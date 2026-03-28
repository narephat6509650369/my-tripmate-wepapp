import express from 'express';
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors';
import { validateGoogleLogin, verifyToken } from '../middleware/validate.js';
import { googleLogin, logout, getMe, refreshToken } from '../controllers/authController.js';

const router = express.Router();

// === CORS สำหรับ Google login route ===
const allowedOrigins = [
  "https://my-tripmate-wepapp-1.onrender.com",
  // "http://localhost:5173", // dev
];

// ระบุ type ให้ origin และ callback
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// เพิ่ม CORS middleware ตรง route
router.post('/google', cors(corsOptions), validateGoogleLogin, googleLogin);
router.get('/me', verifyToken, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;
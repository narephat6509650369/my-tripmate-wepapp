import express from 'express';
import { validateGoogleLogin } from '../middleware/validate.js';
import { googleLogin ,logout} from '../controllers/authController.js';


const router = express.Router();

router.post('/google', validateGoogleLogin, googleLogin);

router.post('/logout', logout);
export default router;
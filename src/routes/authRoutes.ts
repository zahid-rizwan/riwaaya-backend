import { Router } from 'express';
import { registerCustomer, registerSeller, login, getMe, sendOtp, verifyOtp } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register/customer', registerCustomer);
router.post('/register/seller', registerSeller);
router.post('/login', login);
router.get('/me', protect, getMe);

// Phone + OTP Login
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

export default router;

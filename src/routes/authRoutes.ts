import { Router } from 'express';
import { registerCustomer, registerSeller, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register/customer', registerCustomer);
router.post('/register/seller', registerSeller);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;

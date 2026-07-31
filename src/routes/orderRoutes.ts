import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById } from '../controllers/orderController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

export default router;

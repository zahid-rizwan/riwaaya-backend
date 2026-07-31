import { Router } from 'express';
import { getSellerStats, getSellerProducts, getSellerOrders, updateOrderItemStatus } from '../controllers/sellerController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('SELLER', 'ADMIN'));

router.get('/stats', getSellerStats);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.put('/orders/:orderId/items/:itemId', updateOrderItemStatus);

export default router;

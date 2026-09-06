import { Router } from 'express';
import { getSellerStats, getSellerProducts, getSellerOrders, updateOrderItemStatus } from '../controllers/sellerController';
import { updateProduct, deleteProduct } from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('SELLER', 'ADMIN'));

router.get('/stats', getSellerStats);
router.get('/products', getSellerProducts);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getSellerOrders);
router.put('/orders/:orderId/items/:itemId', updateOrderItemStatus);

export default router;

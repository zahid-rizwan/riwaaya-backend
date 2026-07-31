import { Router } from 'express';
import { getAdminDashboardStats, getAllSellers, approveSeller, approveProduct, getAllOrders } from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/stats', getAdminDashboardStats);
router.get('/sellers', getAllSellers);
router.put('/sellers/:sellerId/approve', approveSeller);
router.put('/products/:productId/approve', approveProduct);
router.get('/orders', getAllOrders);

export default router;

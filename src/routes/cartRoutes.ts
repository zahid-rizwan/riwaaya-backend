import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, mergeCart } from '../controllers/cartController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Public routes (work with sessionId for guests OR userId for logged-in users)
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);

// Protected route: merge guest cart into user cart (requires JWT auth)
router.post('/merge', protect, mergeCart);

export default router;

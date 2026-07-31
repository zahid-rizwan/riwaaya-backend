import { Router } from 'express';
import { getProducts, getProductById, createProduct, createVariant, updateProduct, deleteProduct } from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('SELLER', 'ADMIN'), createProduct);
router.post('/:id/variants', protect, authorize('SELLER', 'ADMIN'), createVariant);
router.put('/:id', protect, authorize('SELLER', 'ADMIN'), updateProduct);
router.delete('/:id', protect, authorize('SELLER', 'ADMIN'), deleteProduct);

export default router;

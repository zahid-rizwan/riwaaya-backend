import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getProducts, getProductById, createProduct, createVariant, updateProduct, deleteProduct, uploadImage, uploadImages } from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { createProductSchema } from '../schemas/productSchema';

const router = Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed!'));
  }
});

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('SELLER', 'ADMIN'), validate(createProductSchema), createProduct);
router.post('/upload', protect, authorize('SELLER', 'ADMIN'), upload.array('images', 10), uploadImages);
router.post('/:id/variants', protect, authorize('SELLER', 'ADMIN'), createVariant);
router.put('/:id', protect, authorize('SELLER', 'ADMIN'), updateProduct);
router.delete('/:id', protect, authorize('SELLER', 'ADMIN'), deleteProduct);

export default router;

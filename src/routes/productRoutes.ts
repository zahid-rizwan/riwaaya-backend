import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getProducts, getProductById, createProduct, createVariant, updateProduct, deleteProduct, uploadImage, uploadImages } from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Configure multer storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed!'));
  }
});

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('SELLER', 'ADMIN'), createProduct);
router.post('/upload', protect, authorize('SELLER', 'ADMIN'), upload.array('images', 10), uploadImages);
router.post('/:id/variants', protect, authorize('SELLER', 'ADMIN'), createVariant);
router.put('/:id', protect, authorize('SELLER', 'ADMIN'), updateProduct);
router.delete('/:id', protect, authorize('SELLER', 'ADMIN'), deleteProduct);

export default router;

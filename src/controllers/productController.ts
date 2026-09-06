import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { productStore, ProductItem } from '../store/productStore';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { ensureDbConnected } from '../config/db';

const sanitizeProductImages = (products: any[], req: Request) => {
  const host = `${req.protocol}://${req.get('host')}`;
  return products.map(p => {
    if (Array.isArray(p.images)) {
      p.images = p.images.map((img: string) =>
        typeof img === 'string' ? img.replace(/^http:\/\/localhost:\d+/, host) : img
      );
    }
    return p;
  });
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbConnected();
    const { tag, search, status } = req.query;
    
    const filterQuery: any = {};
    if (tag && tag !== 'all') {
      filterQuery.tag = tag;
    }
    if (search) {
      filterQuery.name = { $regex: search as string, $options: 'i' };
    }
    if (status === 'ALL') {
      // return all statuses
    } else if (status) {
      filterQuery.status = status;
    } else {
      filterQuery.status = { $in: ['APPROVED', 'PENDING'] };
    }

    let products: any[] = [];
    if (mongoose.connection.readyState === 1) {
      products = await Product.find(filterQuery)
        .populate('seller', 'shopName name email')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .maxTimeMS(5000);
    } else {
      let storeItems = productStore.getAll();
      if (tag && tag !== 'all') storeItems = storeItems.filter(p => p.tag === tag);
      if (search) {
        const q = (search as string).toLowerCase();
        storeItems = storeItems.filter(p => p.name?.toLowerCase().includes(q));
      }
      if (status && status !== 'ALL') {
        storeItems = storeItems.filter(p => p.status === status);
      }
      products = storeItems;
    }

    const sanitized = sanitizeProductImages(products, req);
    return sendResponse(res, 200, 'Products fetched successfully', sanitized, { count: sanitized.length });
  } catch (error) {
    return next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbConnected();
    const { id } = req.params;
    let dbProduct: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      dbProduct = await Product.findById(id)
        .populate('seller', 'shopName name email phone shopDescription')
        .populate('category', 'name slug description')
        .maxTimeMS(5000)
        .catch(() => null);
    }

    if (dbProduct) {
      return sendResponse(res, 200, 'Product details fetched', dbProduct);
    }

    const memoryProduct = productStore.findById(id);
    if (memoryProduct) {
      return sendResponse(res, 200, 'Product details fetched', memoryProduct);
    }

    throw new ApiError(404, 'Product not found');
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await ensureDbConnected();
    const { name, category, tag, price, stock, images, description, materials, shipping, variants, status } = req.body;

    let validCategoryObjId: mongoose.Types.ObjectId | undefined = undefined;
    let validSellerObjId: mongoose.Types.ObjectId | undefined = undefined;

    if (mongoose.connection.readyState === 1) {
      if (category && mongoose.Types.ObjectId.isValid(category)) {
        validCategoryObjId = new mongoose.Types.ObjectId(category);
      } else {
        const targetSlug = tag || (category === '1' ? 'suits' : category === '2' ? 'coords' : category === '3' ? 'party' : category === '4' ? 'hampers' : 'suits');
        const catDoc = await Category.findOne({ slug: targetSlug }).maxTimeMS(5000).catch(() => null);
        if (catDoc) {
          validCategoryObjId = catDoc._id as mongoose.Types.ObjectId;
        }
      }

      if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
        validSellerObjId = new mongoose.Types.ObjectId(req.user._id);
      } else {
        const defaultSeller = await User.findOne({ role: 'SELLER' }).maxTimeMS(5000).catch(() => null);
        if (defaultSeller) {
          validSellerObjId = defaultSeller._id as mongoose.Types.ObjectId;
        }
      }
    }

    const initialStatus = status || 'APPROVED';
    let dbDoc: any = null;

    if (mongoose.connection.readyState === 1) {
      dbDoc = await Product.create({
        name: name || 'New Atelier Suit',
        tag: tag || 'suits',
        price: price ? parseFloat(price) : 18500,
        stock: stock ? parseInt(stock) : 10,
        images: images && images.length > 0 ? images : ["/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png"],
        description: description || 'Handcrafted luxury apparel.',
        materials: materials || 'Pure Lawn Cotton & Silk. Dry clean only.',
        shipping: shipping || 'Free delivery on orders over PKR 5,000. 7-day return policy.',
        status: initialStatus,
        seller: validSellerObjId,
        category: validCategoryObjId
      }).catch(err => {
        console.log('MongoDB Insert Error/Note:', err.message);
        return null;
      });
    }

    const assignedId = dbDoc ? dbDoc._id.toString() : (new mongoose.Types.ObjectId()).toString();

    const newProductItem: ProductItem = {
      _id: assignedId,
      id: assignedId,
      name: name || 'New Atelier Suit',
      price: price ? parseFloat(price) : 18500,
      stock: stock ? parseInt(stock) : 10,
      tag: tag || 'suits',
      badge: 'New',
      images: images && images.length > 0 ? images : ["/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png"],
      description: description || 'Handcrafted luxury apparel.',
      materials: materials || 'Pure Lawn Cotton & Silk. Dry clean only.',
      shipping: shipping || 'Free delivery on orders over PKR 5,000. 7-day return policy.',
      status: initialStatus,
      variants: variants && variants.length > 0 ? variants : [
        { id: `v_${Date.now()}`, sku: `SKU-${Date.now().toString().slice(-4)}`, size: 'M', price: price ? parseFloat(price) : 18500, stock: stock ? parseInt(stock) : 10 }
      ],
      createdAt: new Date().toISOString()
    };

    productStore.add(newProductItem);
    return sendResponse(res, 201, 'Product created successfully', dbDoc || newProductItem);
  } catch (error) {
    return next(error);
  }
};

export const createVariant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { sku, price, stock, available_stock, size } = req.body;

    const newVariant = {
      id: `v_${Date.now()}`,
      sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      size: size || 'M',
      price: price ? parseFloat(price) : 18500,
      stock: stock ? parseInt(stock) : (available_stock ? parseInt(available_stock) : 10)
    };

    const updatedProd = productStore.addVariant(id, newVariant);
    return sendResponse(res, 201, 'Variant added successfully', updatedProd || newVariant);
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await ensureDbConnected();
    const { id } = req.params;
    let product: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findByIdAndUpdate(id, req.body, { new: true })
        .maxTimeMS(5000)
        .catch(() => null);
    }
    if (product) return sendResponse(res, 200, 'Product updated successfully', product);

    const memItem = productStore.update(id, req.body);
    if (memItem) {
      return sendResponse(res, 200, 'Product updated successfully', memItem);
    }

    throw new ApiError(404, 'Product not found for update');
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await ensureDbConnected();
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Product.findByIdAndDelete(id).maxTimeMS(5000).catch(() => null);
    }
    productStore.remove(id);
    return sendResponse(res, 200, 'Product removed successfully', { id });
  } catch (error) {
    return next(error);
  }
};

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No image file uploaded');
    }
    
    let fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    if (req.file.buffer) {
      fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    return sendResponse(res, 200, 'Image uploaded successfully', {
      url: fileUrl,
      filename: req.file.filename || req.file.originalname
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadImages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new ApiError(400, 'No image files uploaded');
    }

    const urls = files.map(file => {
      if (file.buffer) {
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
      return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    });

    return sendResponse(res, 200, 'Images uploaded successfully', { urls });
  } catch (error) {
    return next(error);
  }
};

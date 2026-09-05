import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';
import { productStore, ProductItem } from '../store/productStore';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

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
    const { tag, search, status } = req.query;
    
    let dbProducts: any[] = [];
    if (mongoose.connection.readyState === 1) {
      dbProducts = await Product.find()
        .populate('seller', 'shopName name email')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .maxTimeMS(2000)
        .catch(err => {
          console.log('MongoDB getProducts note:', err.message);
          return [];
        });
    }

    const storeItems = productStore.getAll();
    const combinedMap = new Map<string, any>();

    // Add in-memory/JSON storeItems first
    storeItems.forEach(item => {
      combinedMap.set(item._id || item.id!, item);
    });

    // Merge DB products
    dbProducts.forEach((p: any) => {
      const idStr = p._id.toString();
      const existing = combinedMap.get(idStr);
      combinedMap.set(idStr, {
        _id: idStr,
        id: idStr,
        name: p.name,
        price: p.price,
        stock: p.stock,
        tag: p.tag || 'suits',
        badge: p.badge || existing?.badge || 'New',
        status: p.status || existing?.status || 'APPROVED',
        seller: p.seller || { shopName: 'Seller A Atelier', name: 'Zahid' },
        description: p.description,
        materials: p.materials || existing?.materials,
        shipping: p.shipping || existing?.shipping,
        images: p.images && p.images.length > 0 ? p.images : ["/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png"],
        variants: p.variants || existing?.variants || []
      });
    });

    let allProducts = Array.from(combinedMap.values());

    if (status === 'ALL') {
      // return all
    } else if (status) {
      allProducts = allProducts.filter(p => p.status === status);
    } else {
      allProducts = allProducts.filter(p => p.status === 'APPROVED' || p.status === 'PENDING');
    }

    if (tag && tag !== 'all') {
      allProducts = allProducts.filter(p => p.tag === tag);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      allProducts = allProducts.filter(p => p.name?.toLowerCase().includes(q));
    }

    const sanitized = sanitizeProductImages(allProducts, req);
    return sendResponse(res, 200, 'Products fetched successfully', sanitized, { count: sanitized.length });
  } catch (error) {
    return next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let dbProduct: any = null;
    if (mongoose.connection.readyState === 1) {
      dbProduct = await Product.findById(id)
        .populate('seller', 'shopName name email phone shopDescription')
        .populate('category', 'name slug description')
        .maxTimeMS(2000)
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
    const { name, category, tag, price, stock, images, description, materials, shipping, variants } = req.body;

    const dbDoc = await Product.create({
      name: name || 'New Atelier Suit',
      tag: tag || 'coords',
      price: price ? parseFloat(price) : 18500,
      stock: stock ? parseInt(stock) : 10,
      images: images && images.length > 0 ? images : ["/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png"],
      description: description || 'Handcrafted luxury apparel.',
      materials: materials || 'Pure Lawn Cotton & Silk. Dry clean only.',
      shipping: shipping || 'Free delivery on orders over PKR 5,000. 7-day return policy.',
      status: 'PENDING'
    }).catch(err => {
      console.log('MongoDB Insert Note:', err.message);
      return null;
    });

    const assignedId = dbDoc ? dbDoc._id.toString() : Date.now().toString();

    const newProductItem: ProductItem = {
      _id: assignedId,
      id: assignedId,
      name: name || 'New Atelier Suit',
      price: price ? parseFloat(price) : 18500,
      stock: stock ? parseInt(stock) : 10,
      tag: tag || 'coords',
      badge: 'New',
      images: images && images.length > 0 ? images : ["/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png"],
      description: description || 'Handcrafted luxury apparel.',
      materials: materials || 'Pure Lawn Cotton & Silk. Dry clean only.',
      shipping: shipping || 'Free delivery on orders over PKR 5,000. 7-day return policy.',
      status: 'PENDING',
      variants: variants && variants.length > 0 ? variants : [
        { id: `v_${Date.now()}`, sku: `SKU-${Date.now().toString().slice(-4)}`, size: 'M', price: price ? parseFloat(price) : 18500, stock: stock ? parseInt(stock) : 10 }
      ],
      createdAt: new Date().toISOString()
    };

    productStore.add(newProductItem);
    return sendResponse(res, 201, 'Product created successfully', newProductItem);
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
    const { id } = req.params;
    let product: any = null;
    if (mongoose.connection.readyState === 1) {
      product = await Product.findByIdAndUpdate(id, req.body, { new: true })
        .maxTimeMS(2000)
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
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      await Product.findByIdAndDelete(id).maxTimeMS(2000).catch(() => null);
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

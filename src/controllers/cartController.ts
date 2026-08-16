import { Request, Response, NextFunction } from 'express';
import { cartStore } from '../store/cartStore';
import { productStore } from '../store/productStore';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Helper: Extract userId (from JWT auth) and sessionId (from header/query) from request.
 * If user is authenticated via `protect` middleware, req.user._id is used.
 * Otherwise falls back to session-based guest cart.
 */
const getCartIdentifiers = (req: Request) => {
  const authReq = req as AuthRequest;
  let userId = authReq.user?._id?.toString() || undefined;

  // Manually decode token if protect middleware was not used
  if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      // jsonwebtoken is imported at the top of the file ideally, but we can require it here for simplicity
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'riwaaya_secret');
      if (decoded && decoded.id) {
        userId = decoded.id;
      }
    } catch (e) {
      // ignore
    }
  }

  const sessionId = (req.headers['x-session-id'] as string) || req.query.sessionId as string || req.body?.sessionId;
  return { userId, sessionId };
};

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getCartIdentifiers(req);
    const cart = cartStore.getCart(userId, sessionId);
    return sendResponse(res, 200, 'Cart details fetched', cart);
  } catch (error) {
    return next(error);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getCartIdentifiers(req);
    const { productId, size, quantity, color } = req.body;

    if (!productId) {
      throw new ApiError(400, 'Product ID is required');
    }

    const prod = productStore.findById(productId);
    const prodName = prod ? prod.name : req.body.name || 'Artisan Couture Suit';
    const prodPrice = prod ? prod.price : (req.body.price ? parseFloat(req.body.price) : 18500);
    const prodImg = (prod && prod.images && prod.images[0]) ? prod.images[0] : (req.body.image || '/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png');
    const prodCategory = prod ? (prod.tag || 'Pakistani Suit') : (req.body.category || 'Pakistani Suit');

    const updatedCart = cartStore.addToCart({
      productId,
      name: prodName,
      category: typeof prodCategory === 'string' ? prodCategory : 'Pakistani Suit',
      price: prodPrice,
      image: prodImg,
      size: size || 'M',
      color: color || 'Ivory',
      quantity: quantity ? parseInt(quantity) : 1
    }, userId, sessionId);

    return sendResponse(res, 200, 'Item added to bag', updatedCart);
  } catch (error) {
    return next(error);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getCartIdentifiers(req);
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!itemId) {
      throw new ApiError(400, 'Cart item ID is required');
    }

    const updatedCart = cartStore.updateQuantity(itemId, parseInt(quantity || '1'), userId, sessionId);
    return sendResponse(res, 200, 'Cart updated', updatedCart);
  } catch (error) {
    return next(error);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getCartIdentifiers(req);
    const { itemId } = req.params;

    if (!itemId) {
      throw new ApiError(400, 'Cart item ID is required');
    }

    const updatedCart = cartStore.removeItem(itemId, userId, sessionId);
    return sendResponse(res, 200, 'Item removed from bag', updatedCart);
  } catch (error) {
    return next(error);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getCartIdentifiers(req);
    const updatedCart = cartStore.clearCart(userId, sessionId);
    return sendResponse(res, 200, 'Cart cleared', updatedCart);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/cart/merge
 * Merges guest session cart items into authenticated user's cart.
 * Called by frontend immediately after login.
 * Body: { sessionId: string }
 */
export const mergeCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id?.toString();
    const sessionId = req.body.sessionId || (req.headers['x-session-id'] as string);

    if (!userId) {
      throw new ApiError(401, 'User must be authenticated to merge cart');
    }

    if (!sessionId) {
      throw new ApiError(400, 'Guest session ID is required for merge');
    }

    const mergedCart = cartStore.mergeCart(userId, sessionId);
    return sendResponse(res, 200, 'Guest cart merged into your account successfully', mergedCart);
  } catch (error) {
    return next(error);
  }
};

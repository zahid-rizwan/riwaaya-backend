import { Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';

import mongoose from 'mongoose';
import { productStore } from '../store/productStore';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of orderItems) {
      let price = item.price;
      let name = item.name;
      let image = item.image;
      let sellerId = '66a3d1234567890123456789'; // Default seller ID for in-memory products
      let validProductId = new mongoose.Types.ObjectId().toString(); // Fallback ObjectId

      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        const dbProduct = await Product.findById(item.productId);
        if (dbProduct) {
          price = dbProduct.price;
          name = dbProduct.name;
          image = dbProduct.images[0] || image;
          sellerId = dbProduct.seller ? dbProduct.seller.toString() : sellerId;
          validProductId = dbProduct._id.toString();
        }
      } else {
        const memProduct = productStore.findById(item.productId);
        if (memProduct) {
          price = memProduct.price;
          name = memProduct.name;
          image = memProduct.images[0] || image;
        }
      }

      const itemTotal = price * item.quantity;
      calculatedTotal += itemTotal;

      processedItems.push({
        product: validProductId,
        seller: sellerId,
        name,
        price,
        quantity: item.quantity,
        image,
        size: item.size,
        color: item.color
      });
    }

    const order = await Order.create({
      customer: req.user?._id,
      orderItems: processedItems,
      totalAmount: calculatedTotal,
      shippingAddress,
      status: 'PENDING',
      paymentMethod: req.body.paymentMethod || 'COD',
      paymentStatus: req.body.paymentMethod === 'RAZORPAY' ? 'PAID' : 'PENDING',
      razorpayOrderId: req.body.razorpayOrderId,
      razorpayPaymentId: req.body.razorpayPaymentId,
      razorpaySignature: req.body.razorpaySignature
    });

    // Clear the cart for the user who placed the order
    if (req.user?._id) {
      const { cartStore } = require('../store/cartStore');
      cartStore.clearCart(req.user._id.toString());
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};


export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    let orders: any[] = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find({ customer: req.user?._id })
        .sort({ createdAt: -1 })
        .maxTimeMS(2000)
        .catch(() => []);
    }
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    let order: any = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findById(req.params.id)
        .populate('customer', 'name email phone')
        .maxTimeMS(2000)
        .catch(() => null);
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

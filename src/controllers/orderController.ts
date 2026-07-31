import { Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of orderItems) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }

      const itemTotal = dbProduct.price * item.quantity;
      calculatedTotal += itemTotal;

      processedItems.push({
        product: dbProduct._id,
        seller: dbProduct.seller,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        image: dbProduct.images[0] || item.image || ''
      });
    }

    const order = await Order.create({
      customer: req.user?._id,
      orderItems: processedItems,
      totalAmount: calculatedTotal,
      shippingAddress,
      status: 'PENDING',
      paymentStatus: 'PAID'
    });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ customer: req.user?._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('orderItems.product', 'name images price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

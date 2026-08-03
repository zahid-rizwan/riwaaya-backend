import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import sellerRoutes from './routes/sellerRoutes';
import adminRoutes from './routes/adminRoutes';
import orderRoutes from './routes/orderRoutes';
import { seedInitialData } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/riwaaya_threads';

// Enable CORS for all frontend apps
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to Riwaaya Threads Node.js API Backend',
    status: 'Active',
    health: '/api/health',
    endpoints: [
      '/api/auth',
      '/api/products',
      '/api/seller',
      '/api/admin',
      '/api/orders'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Riwaaya Threads Node.js API', time: new Date() });
});

// Connect to MongoDB asynchronously
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Database');
    await seedInitialData();
  } catch (err) {
    console.log('ℹ️ Running in fallback mode (MongoDB connecting or offline).');
  }
};

// Ensure DB is connected for incoming serverless requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Start local server if not running on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Riwaaya Threads Backend Server active on http://localhost:${PORT}`);
  });
}

export default app;

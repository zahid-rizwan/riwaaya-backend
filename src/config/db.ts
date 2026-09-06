import mongoose from 'mongoose';

export const ensureDbConnected = async (): Promise<boolean> => {
  const state = mongoose.connection.readyState as number;
  if (state === 1) return true;

  if (state === 2) {
    let count = 0;
    while ((mongoose.connection.readyState as number) !== 1 && count < 30) {
      await new Promise(res => setTimeout(res, 200));
      count++;
    }
    return (mongoose.connection.readyState as number) === 1;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/riwaaya_threads';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB Database');
    return true;
  } catch (err: any) {
    console.error('❌ MongoDB connection error:', err.message);
    return false;
  }
};

import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export const ensureDbConnected = async (): Promise<boolean> => {
  if ((mongoose.connection.readyState as number) === 1) {
    return true;
  }

  if (cached.promise) {
    try {
      await cached.promise;
      return (mongoose.connection.readyState as number) === 1;
    } catch {
      cached.promise = null;
    }
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/riwaaya_threads';

  cached.promise = mongoose
    .connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'riwaaya_threads',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 45000
    })
    .then(m => {
      console.log('✅ Connected to MongoDB Database');
      return m;
    })
    .catch(err => {
      cached.promise = null;
      console.error('❌ MongoDB connection error:', err.message);
      throw err;
    });

  try {
    await cached.promise;
    return true;
  } catch {
    return false;
  }
};


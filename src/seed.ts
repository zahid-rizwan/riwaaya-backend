import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User';
import Category from './models/Category';
import Product from './models/Product';

export const seedInitialData = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    
    if (adminCount === 0) {
      console.log('🌱 Seeding initial admin, seller, categories, and products...');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create Admin
      const admin = await User.create({
        name: 'Riwaaya Admin',
        email: 'admin@riwaayathreads.com',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '+92 300 0000000'
      });

      // Create Seller
      const seller = await User.create({
        name: 'Gulzar Couture',
        email: 'seller@gulzar.com',
        password: hashedPassword,
        role: 'SELLER',
        phone: '+92 300 1111111',
        shopName: 'Gulzar Artisan Atelier',
        shopDescription: 'Master craftsmen producing hand-embroidered lawn, organza, and silk suits.',
        isSellerApproved: true
      });

      // Create Categories
      const categoriesData = [
        { name: 'Pakistani Suits', slug: 'suits', description: 'Timeless silhouettes crafted with elegance and tradition.' },
        { name: 'Co-Ord Sets', slug: 'coords', description: 'Effortlessly curated pairings for the modern woman.' },
        { name: 'Party Wear', slug: 'party', description: 'Festive glamour for celebrations and formal events.' },
        { name: 'Gift Hampers', slug: 'hampers', description: 'Luxuriously curated gifts for memorable moments.' }
      ];

      await Category.insertMany(categoriesData).catch(() => null);
      console.log('✅ Seeding complete!');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

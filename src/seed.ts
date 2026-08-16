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

      const createdCategories = await Category.insertMany(categoriesData);
      const suitsCat = createdCategories.find(c => c.slug === 'suits');
      const coordsCat = createdCategories.find(c => c.slug === 'coords');
      const partyCat = createdCategories.find(c => c.slug === 'party');
      const hampersCat = createdCategories.find(c => c.slug === 'hampers');

      // Create Sample Products
      const initialProducts = [
        {
          name: "Gulzar Ivory Suit",
          seller: seller._id,
          category: suitsCat?._id,
          tag: "suits",
          price: 18500,
          stock: 12,
          images: ["/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png"],
          badge: "New",
          status: "APPROVED",
          description: "Intricately embroidered ivory lawn suit with pure silk dupatta."
        },
        {
          name: "Amber Heritage Lawn",
          seller: seller._id,
          category: coordsCat?._id,
          tag: "coords",
          price: 14200,
          stock: 8,
          images: ["/assets/f5033b1a4ddb926f41bc87a1c3a2f99082eaa624.png"],
          badge: "Bestseller",
          status: "APPROVED",
          description: "2-piece curated lawn co-ord set with handcrafted threadwork."
        },
        {
          name: "Rose Dust Gharara",
          seller: seller._id,
          category: partyCat?._id,
          tag: "party",
          price: 24500,
          stock: 5,
          images: ["/assets/14b11c8de3394bd25477cfb02149a056c046d507.png"],
          badge: "Limited",
          status: "APPROVED",
          description: "Bridal ready formal gharara set with tilla & sequin work."
        },
        {
          name: "Shahi Heritage Hamper",
          seller: seller._id,
          category: hampersCat?._id,
          tag: "hampers",
          price: 12500,
          stock: 15,
          images: ["/assets/bfbf18493c6f15c8b582f56fad304f8de3f26c0f.png"],
          badge: "Exclusive",
          status: "APPROVED",
          description: "Luxury gift hamper including handcrafted shawl, perfume, and dried fruits box."
        }
      ];

      await Product.insertMany(initialProducts);
      console.log('✅ Seeding complete!');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  // Seller specific fields
  shopName?: string;
  shopDescription?: string;
  isSellerApproved?: boolean;
  commissionRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'SELLER', 'CUSTOMER'], default: 'CUSTOMER' },
    phone: { type: String, trim: true },
    // Seller fields
    shopName: { type: String, trim: true },
    shopDescription: { type: String, trim: true },
    isSellerApproved: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 } // Default 10% commission
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);

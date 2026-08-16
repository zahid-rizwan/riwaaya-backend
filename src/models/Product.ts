import mongoose, { Schema, Document } from 'mongoose';

export type ProductStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IProduct extends Document {
  name: string;
  seller?: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  tag: string;
  price: number;
  stock: number;
  images: string[];
  badge?: string;
  status: ProductStatus;
  description?: string;
  materials?: string;
  shipping?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: false },
    tag: { type: String, required: true, default: 'suits' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 1 },
    images: [{ type: String }],
    badge: { type: String, trim: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    description: { type: String },
    materials: { type: String },
    shipping: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);

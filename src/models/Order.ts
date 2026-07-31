import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface IOrder extends Document {
  customer: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
  };
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        image: { type: String }
      }
    ],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String }
    },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' }
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);

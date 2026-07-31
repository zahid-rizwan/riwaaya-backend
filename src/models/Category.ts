import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String },
    description: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', CategorySchema);

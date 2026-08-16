import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product title must be at least 2 characters').max(150),
    price: z.number().positive('Price must be greater than 0'),
    stock: z.number().int().nonnegative('Stock level cannot be negative'),
    category: z.string().min(1, 'Category is required'),
    tag: z.string().optional(),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    materials: z.string().optional(),
    shipping: z.string().optional(),
    images: z.array(z.string()).optional(),
    variants: z.array(z.object({
      size: z.string(),
      sku: z.string(),
      price: z.number().positive(),
      stock: z.number().int().nonnegative()
    })).optional()
  })
});

export const updateProductStatusSchema = z.object({
  params: z.object({
    productId: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
  })
});

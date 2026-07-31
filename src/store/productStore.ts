import fs from 'fs';
import path from 'path';

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  price: number;
  stock: number;
}

export interface ProductItem {
  _id: string;
  id?: string;
  name: string;
  price: number;
  stock: number;
  tag: string;
  badge?: string;
  images: string[];
  description?: string;
  status: string;
  variants?: ProductVariant[];
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'products.json');

export const initialMemoryProducts: ProductItem[] = [
  {
    _id: '1',
    id: '1',
    name: "Gulzar Ivory Suit",
    price: 18500,
    stock: 12,
    tag: "suits",
    badge: "New",
    images: ["/assets/1540aab590cd7d478ad01cdb1a615d469ef2a808.png"],
    description: "Intricately embroidered ivory lawn suit with pure silk dupatta.",
    status: "APPROVED",
    variants: [
      { id: 'v1', sku: 'GUL-IVORY-S', size: 'S', price: 18500, stock: 4 },
      { id: 'v2', sku: 'GUL-IVORY-M', size: 'M', price: 18500, stock: 5 },
      { id: 'v3', sku: 'GUL-IVORY-L', size: 'L', price: 18500, stock: 3 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    id: '2',
    name: "Amber Heritage Lawn",
    price: 14200,
    stock: 8,
    tag: "coords",
    badge: "Bestseller",
    images: ["/assets/f5033b1a4ddb926f41bc87a1c3a2f99082eaa624.png"],
    description: "2-piece curated lawn co-ord set with handcrafted threadwork.",
    status: "APPROVED",
    variants: [
      { id: 'v4', sku: 'AMB-LAWN-M', size: 'M', price: 14200, stock: 5 },
      { id: 'v5', sku: 'AMB-LAWN-L', size: 'L', price: 14200, stock: 3 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: '3',
    id: '3',
    name: "Rose Dust Gharara",
    price: 24500,
    stock: 5,
    tag: "party",
    badge: "Limited",
    images: ["/assets/14b11c8de3394bd25477cfb02149a056c046d507.png"],
    description: "Bridal ready formal gharara set with tilla & sequin work.",
    status: "APPROVED",
    variants: [
      { id: 'v6', sku: 'ROSE-GHAR-M', size: 'M', price: 24500, stock: 3 },
      { id: 'v7', sku: 'ROSE-GHAR-L', size: 'L', price: 24500, stock: 2 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: '4',
    id: '4',
    name: "Shahi Heritage Hamper",
    price: 12500,
    stock: 15,
    tag: "hampers",
    badge: "Exclusive",
    images: ["/assets/bfbf18493c6f15c8b582f56fad304f8de3f26c0f.png"],
    description: "Luxury gift hamper including handcrafted shawl, perfume, and dried fruits box.",
    status: "APPROVED",
    variants: [
      { id: 'v8', sku: 'SHAHI-HAMP-STD', size: 'Standard', price: 12500, stock: 15 }
    ],
    createdAt: new Date().toISOString()
  }
];

class ProductStore {
  private products: ProductItem[] = [];

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          this.products = data;
          return;
        }
      }
    } catch (e) {
      console.log('Error loading products file, using initial data:', e);
    }
    this.products = [...initialMemoryProducts];
    this.saveToFile();
  }

  private saveToFile(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(FILE_PATH, JSON.stringify(this.products, null, 2), 'utf-8');
    } catch (e) {
      console.log('Error saving products file:', e);
    }
  }

  public getAll(): ProductItem[] {
    return this.products;
  }

  public add(item: ProductItem): ProductItem {
    this.products.unshift(item);
    this.saveToFile();
    return item;
  }

  public findById(id: string): ProductItem | undefined {
    return this.products.find(p => p._id === id || p.id === id);
  }

  public updateStatus(id: string, status: string): ProductItem | undefined {
    const prod = this.findById(id);
    if (prod) {
      prod.status = status;
      this.saveToFile();
    }
    return prod;
  }

  public addVariant(productId: string, variant: ProductVariant): ProductItem | undefined {
    const prod = this.findById(productId);
    if (prod) {
      if (!prod.variants) prod.variants = [];
      prod.variants.push(variant);
      prod.stock += variant.stock;
      this.saveToFile();
    }
    return prod;
  }
}

export const productStore = new ProductStore();

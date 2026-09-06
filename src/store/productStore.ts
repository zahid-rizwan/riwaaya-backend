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
  materials?: string;
  shipping?: string;
  status: string;
  variants?: ProductVariant[];
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'products.json');

export const initialMemoryProducts: ProductItem[] = [];

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
        if (Array.isArray(data)) {
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

  public update(id: string, updates: Partial<ProductItem>): ProductItem | undefined {
    const prod = this.findById(id);
    if (prod) {
      Object.assign(prod, updates);
      this.saveToFile();
    }
    return prod;
  }

  public remove(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter(p => p._id !== id && p.id !== id);
    const removed = this.products.length < initialLen;
    if (removed) {
      this.saveToFile();
    }
    return removed;
  }
}

export const productStore = new ProductStore();

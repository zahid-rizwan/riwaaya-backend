export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  image: string;
  size: string;
  color?: string;
  quantity: number;
}

export interface CartData {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  grandTotal: number;
}

class CartStore {
  private userCarts: Map<string, CartItem[]> = new Map();

  private getSessionKey(userId?: string, sessionId?: string): string {
    return userId || sessionId || 'default_guest_session';
  }

  private calculateTotals(items: CartItem[]): CartData {
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 350;
    const discount = 0;
    const grandTotal = subtotal + shipping - discount;

    return { items, subtotal, shipping, discount, grandTotal };
  }

  public getCart(userId?: string, sessionId?: string): CartData {
    const key = this.getSessionKey(userId, sessionId);
    const items = this.userCarts.get(key) || [];
    return this.calculateTotals(items);
  }

  public addToCart(item: Omit<CartItem, 'id'>, userId?: string, sessionId?: string): CartData {
    const key = this.getSessionKey(userId, sessionId);
    const current = this.userCarts.get(key) || [];

    const existingIndex = current.findIndex(
      i => i.productId === item.productId && i.size === item.size
    );

    if (existingIndex >= 0) {
      current[existingIndex].quantity += item.quantity;
    } else {
      const newItem: CartItem = {
        ...item,
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
      };
      current.push(newItem);
    }

    this.userCarts.set(key, current);
    return this.getCart(userId, sessionId);
  }

  public updateQuantity(itemId: string, quantity: number, userId?: string, sessionId?: string): CartData {
    const key = this.getSessionKey(userId, sessionId);
    let current = this.userCarts.get(key) || [];

    if (quantity <= 0) {
      current = current.filter(i => i.id !== itemId);
    } else {
      const item = current.find(i => i.id === itemId);
      if (item) {
        item.quantity = quantity;
      }
    }

    this.userCarts.set(key, current);
    return this.getCart(userId, sessionId);
  }

  public removeItem(itemId: string, userId?: string, sessionId?: string): CartData {
    const key = this.getSessionKey(userId, sessionId);
    const current = this.userCarts.get(key) || [];
    const updated = current.filter(i => i.id !== itemId);
    this.userCarts.set(key, updated);
    return this.getCart(userId, sessionId);
  }

  public clearCart(userId?: string, sessionId?: string): CartData {
    const key = this.getSessionKey(userId, sessionId);
    this.userCarts.set(key, []);
    return this.getCart(userId, sessionId);
  }

  /**
   * Merge guest session cart into logged-in user's cart.
   * - Items that already exist in user cart (same productId + size) get quantity added.
   * - New items from guest cart are appended to user cart.
   * - Guest session cart is cleared after merge.
   */
  public mergeCart(userId: string, sessionId: string): CartData {
    const guestItems = this.userCarts.get(sessionId) || [];
    const userItems = this.userCarts.get(userId) || [];

    // If guest has no items, just return user cart as-is
    if (guestItems.length === 0) {
      return this.calculateTotals(userItems);
    }

    // Merge each guest item into user cart
    for (const guestItem of guestItems) {
      const existingIndex = userItems.findIndex(
        ui => ui.productId === guestItem.productId && ui.size === guestItem.size
      );

      if (existingIndex >= 0) {
        // Same product+size exists in user cart → add quantities
        userItems[existingIndex].quantity += guestItem.quantity;
      } else {
        // New item → append with fresh id
        userItems.push({
          ...guestItem,
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
        });
      }
    }

    // Save merged cart under userId
    this.userCarts.set(userId, userItems);

    // Clear guest session cart
    this.userCarts.set(sessionId, []);

    return this.calculateTotals(userItems);
  }
}

export const cartStore = new CartStore();

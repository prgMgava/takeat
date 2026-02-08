import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  options: Array<{
    optionId: string;
    itemIds: string[];
    price: number;
  }>;
  notes?: string;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, restaurantName: string, item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],
      addItem: (restaurantId, restaurantName, item) => {
        const state = get();
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          if (!window.confirm('Seu carrinho possui itens de outro restaurante. Deseja limpar e adicionar este item?')) {
            return;
          }
          set({ restaurantId, restaurantName, items: [item] });
        } else {
          const existingIndex = state.items.findIndex((i) => i.productId === item.productId);
          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
            set({ items: newItems, restaurantId, restaurantName });
          } else {
            set({ items: [...state.items, item], restaurantId, restaurantName });
          }
        }
      },
      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.productId !== productId);
        if (newItems.length === 0) {
          set({ items: [], restaurantId: null, restaurantName: null });
        } else {
          set({ items: newItems });
        }
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        );
        set({ items: newItems });
      },
      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const itemTotal = item.unitPrice * item.quantity;
          const optionsTotal = item.options.reduce((acc, opt) => acc + opt.price, 0) * item.quantity;
          return total + itemTotal + optionsTotal;
        }, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'RESTAURANT_OWNER' | 'CUSTOMER';
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address: string;
  phone?: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime?: string;
  isOpen: boolean;
  categories?: Category[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  promotionalPrice?: number;
  imageUrl?: string;
  preparationTime?: number;
  servings?: number;
  isAvailable: boolean;
  options?: ProductOption[];
}

export interface ProductOption {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  items: OptionItem[];
}

export interface OptionItem {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  isDelivery: boolean;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  restaurant?: Restaurant;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: OrderItemOption[];
}

export interface OrderItemOption {
  id: string;
  optionName: string;
  itemName: string;
  price: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';


export interface MissingInput {
  inputName: string;
  required: number;
  available: number;
  unit: string;
}

export interface ProductStockStatus {
  productId: string;
  productName: string;
  quantity?: number;
  available: boolean;
  missingInputs: MissingInput[];
}

export interface StockCheckResponse {
  allAvailable: boolean;
  products: ProductStockStatus[];
}

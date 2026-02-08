import { Request } from 'express';
import { Model, Optional } from 'sequelize';

// User roles
export type UserRole = 'ADMIN' | 'RESTAURANT_OWNER' | 'CUSTOMER';

// Order status
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

// User attributes
export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'phone' | 'role' | 'isActive' | 'emailVerified'> {}

// RefreshToken attributes
export interface RefreshTokenAttributes {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'isRevoked'> {}

// Restaurant attributes
export interface RestaurantAttributes {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  deliveryFee: number;
  minOrderValue: number;
  estimatedDeliveryTime: number;
  isOpen: boolean;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestaurantCreationAttributes extends Optional<RestaurantAttributes,
  'id' | 'description' | 'cuisine' | 'phone' | 'email' | 'logoUrl' | 'bannerUrl' |
  'deliveryFee' | 'minOrderValue' | 'estimatedDeliveryTime' | 'isOpen' | 'isActive' |
  'rating' | 'totalRatings'> {}

// Category attributes
export interface CategoryAttributes {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'description' | 'sortOrder' | 'isActive'> {}

// Product attributes
export interface ProductAttributes {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'description' | 'imageUrl' | 'isAvailable' | 'isActive' | 'sortOrder'> {}

// ProductOption attributes
export interface ProductOptionAttributes {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductOptionCreationAttributes extends Optional<ProductOptionAttributes, 'id' | 'description' | 'isRequired' | 'minSelections' | 'maxSelections' | 'sortOrder'> {}

// OptionItem attributes
export interface OptionItemAttributes {
  id: string;
  optionId: string;
  name: string;
  price: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OptionItemCreationAttributes extends Optional<OptionItemAttributes, 'id' | 'price' | 'isDefault' | 'isAvailable' | 'sortOrder'> {}

// Input attributes (insumos/ingredientes)
export interface InputAttributes {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  unit: string;
  stockQuantity: number;
  minStock: number;
  costPerUnit: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InputCreationAttributes extends Optional<InputAttributes, 'id' | 'description' | 'unit' | 'stockQuantity' | 'minStock' | 'costPerUnit' | 'isActive'> {}

// ProductInput attributes (ficha técnica)
export interface ProductInputAttributes {
  id: string;
  productId: string;
  inputId: string;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductInputCreationAttributes extends Optional<ProductInputAttributes, 'id'> {}

// Order attributes
export interface OrderAttributes {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZipCode: string;
  deliveryPhone: string;
  notes: string | null;
  confirmedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes,
  'id' | 'orderNumber' | 'status' | 'notes' | 'confirmedAt' | 'preparingAt' |
  'readyAt' | 'outForDeliveryAt' | 'deliveredAt' | 'cancelledAt' | 'cancellationReason'> {}

// OrderItem attributes
export interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'notes'> {}

// OrderItemOption attributes
export interface OrderItemOptionAttributes {
  id: string;
  orderItemId: string;
  optionName: string;
  itemName: string;
  itemPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemOptionCreationAttributes extends Optional<OrderItemOptionAttributes, 'id'> {}

// Extended Express Request with user
export interface AuthenticatedRequest extends Request {
  user?: UserAttributes & { id: string };
  userId?: string;
}

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// JWT Payload
export interface JwtPayload {
  sub: string;
  role?: UserRole;
  jti?: string;
  iat?: number;
  exp?: number;
}

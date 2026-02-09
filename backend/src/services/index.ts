

export { authService } from './auth.service';
export type { RegisterInput, LoginInput, AuthResponse } from './auth.service';

export { orderService } from './order.service';
export type { CreateOrderInput } from './order.service';

export { stockService } from './stock.service';
export type {
  InputConsumption,
  ProductStockStatus,
  OrderItemForStock,
  StockValidationResult,
} from './stock.service';

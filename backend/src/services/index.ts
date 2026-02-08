/**
 * Services Layer
 *
 * Esta camada contém toda a lógica de negócios da aplicação.
 * Os Controllers devem delegar a execução para os Services,
 * mantendo apenas a responsabilidade de:
 * - Extrair dados da requisição
 * - Chamar o Service apropriado
 * - Formatar e retornar a resposta
 *
 * Benefícios desta arquitetura:
 * - Separação clara de responsabilidades
 * - Código mais testável (Services independentes do HTTP)
 * - Reutilização de lógica entre Controllers
 * - Facilita manutenção e evolução
 */

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

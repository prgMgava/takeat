import { Transaction } from 'sequelize';
import { Input, ProductInput, Product } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';

export interface InputConsumption {
  inputId: string;
  inputName: string;
  unit: string;
  required: number;
  available: number;
}

export interface ProductStockStatus {
  productId: string;
  productName: string;
  quantity: number;
  available: boolean;
  missingInputs: Array<{
    inputName: string;
    required: number;
    available: number;
    unit: string;
  }>;
}


export interface OrderItemForStock {
  productId: string;
  productName: string;
  quantity: number;
}

export interface StockValidationResult {
  isValid: boolean;
  inputConsumptionMap: Map<string, InputConsumption>;
  productInputsMap: Map<string, Array<{ inputId: string; quantityPerUnit: number }>>;
  productsWithIssues?: ProductStockStatus[];
}

class StockService {
    orderItems: OrderItemForStock[],
    transaction?: Transaction
  ): Promise<{
    inputConsumptionMap: Map<string, InputConsumption>;
    productInputsMap: Map<string, Array<{ inputId: string; quantityPerUnit: number }>>;
  }> {
    const inputConsumptionMap = new Map<string, InputConsumption>();
    const productInputsMap = new Map<string, Array<{ inputId: string; quantityPerUnit: number }>>();

    for (const orderItem of orderItems) {
      const productInputs = await ProductInput.findAll({
        where: { productId: orderItem.productId },
        include: [{ model: Input, as: 'input' }],
        ...(transaction && { transaction }),
      });

      const productInputsList: Array<{ inputId: string; quantityPerUnit: number }> = [];

      for (const productInput of productInputs) {
        const input = (productInput as ProductInput & { input: Input }).input;
        if (!input || !input.isActive) continue;

        const requiredQuantity = productInput.quantity * orderItem.quantity;
        productInputsList.push({ inputId: input.id, quantityPerUnit: productInput.quantity });

        if (inputConsumptionMap.has(input.id)) {
          const existing = inputConsumptionMap.get(input.id)!;
          existing.required += requiredQuantity;
        } else {
          inputConsumptionMap.set(input.id, {
            inputId: input.id,
            inputName: input.name,
            unit: input.unit,
            required: requiredQuantity,
            available: input.stockQuantity,
          });
        }
      }

      productInputsMap.set(orderItem.productId, productInputsList);
    }

    return { inputConsumptionMap, productInputsMap };
  }

  validateStockAvailability(
    orderItems: OrderItemForStock[],
    inputConsumptionMap: Map<string, InputConsumption>,
    productInputsMap: Map<string, Array<{ inputId: string; quantityPerUnit: number }>>
  ): StockValidationResult {
    const insufficientInputsMap = new Map<string, InputConsumption>();

    for (const [inputId, consumption] of inputConsumptionMap) {
      if (consumption.available < consumption.required) {
        insufficientInputsMap.set(inputId, consumption);
      }
    }

    if (insufficientInputsMap.size === 0) {
      return {
        isValid: true,
        inputConsumptionMap,
        productInputsMap,
      };
    }

    const productsWithIssues: ProductStockStatus[] = [];

    for (const orderItem of orderItems) {
      const productInputsList = productInputsMap.get(orderItem.productId) || [];
      const missingInputs: ProductStockStatus['missingInputs'] = [];

      for (const pi of productInputsList) {
        const insufficient = insufficientInputsMap.get(pi.inputId);
        if (insufficient) {
          missingInputs.push({
            inputName: insufficient.inputName,
            required: pi.quantityPerUnit * orderItem.quantity,
            available: insufficient.available,
            unit: insufficient.unit,
          });
        }
      }

      productsWithIssues.push({
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity: orderItem.quantity,
        available: missingInputs.length === 0,
        missingInputs,
      });
    }

    return {
      isValid: false,
      inputConsumptionMap,
      productInputsMap,
      productsWithIssues,
    };
  }

  async validateAndDecrementStock(
    orderItems: OrderItemForStock[],
    transaction: Transaction
  ): Promise<void> {
    const { inputConsumptionMap, productInputsMap } = await this.calculateInputConsumption(
      orderItems,
      transaction
    );

    const validationResult = this.validateStockAvailability(
      orderItems,
      inputConsumptionMap,
      productInputsMap
    );

    if (!validationResult.isValid) {
      const affectedProducts = validationResult.productsWithIssues!
        .filter(p => !p.available)
        .map(p => p.productName);

      throw new AppError(
        `Estoque insuficiente para: ${affectedProducts.join(', ')}`,
        400,
        'INSUFFICIENT_STOCK',
        { products: validationResult.productsWithIssues }
      );
    }

    for (const [inputId, consumption] of inputConsumptionMap) {
      await Input.decrement(
        { stockQuantity: consumption.required },
        { where: { id: inputId }, transaction }
      );

      logger.info(
        `[StockService] Stock decremented: ${consumption.inputName} - ${consumption.required} ${consumption.unit}`
      );
    }
  }

  async checkStockAvailability(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<{
    allAvailable: boolean;
    products: ProductStockStatus[];
  }> {
    const stockStatus: ProductStockStatus[] = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        include: [
          {
            model: ProductInput,
            as: 'inputs',
            include: [{ model: Input, as: 'input' }],
          },
        ],
      });

      if (!product) {
        stockStatus.push({
          productId: item.productId,
          productName: 'Produto não encontrado',
          quantity: item.quantity,
          available: false,
          missingInputs: [],
        });
        continue;
      }

      const missingInputs: ProductStockStatus['missingInputs'] = [];
      const productWithInputs = product as Product & { inputs: (ProductInput & { input: Input })[] };

      for (const pi of productWithInputs.inputs || []) {
        if (!pi.input || !pi.input.isActive) continue;

        const required = pi.quantity * item.quantity;
        if (pi.input.stockQuantity < required) {
          missingInputs.push({
            inputName: pi.input.name,
            required,
            available: pi.input.stockQuantity,
            unit: pi.input.unit,
          });
        }
      }

      stockStatus.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        available: missingInputs.length === 0,
        missingInputs,
      });
    }

    return {
      allAvailable: stockStatus.every(s => s.available),
      products: stockStatus,
    };
  }


  async revertStockDecrement(
    orderItems: OrderItemForStock[],
    transaction?: Transaction
  ): Promise<void> {
    const { inputConsumptionMap } = await this.calculateInputConsumption(orderItems);

    for (const [inputId, consumption] of inputConsumptionMap) {
      await Input.increment(
        { stockQuantity: consumption.required },
        { where: { id: inputId }, ...(transaction && { transaction }) }
      );

      logger.info(
        `[StockService] Stock reverted: ${consumption.inputName} + ${consumption.required} ${consumption.unit}`
      );
    }
  }

  async adjustStock(
    inputId: string,
    adjustment: number,
    reason: string,
    transaction?: Transaction
  ): Promise<Input> {
    const input = await Input.findByPk(inputId);
    if (!input) {
      throw new AppError('Insumo não encontrado', 404, 'INPUT_NOT_FOUND');
    }

    const newQuantity = input.stockQuantity + adjustment;
    if (newQuantity < 0) {
      throw new AppError(
        `Ajuste resultaria em estoque negativo (atual: ${input.stockQuantity}, ajuste: ${adjustment})`,
        400,
        'NEGATIVE_STOCK'
      );
    }

    await input.update({ stockQuantity: newQuantity }, { ...(transaction && { transaction }) });

    logger.info(
      `[StockService] Stock adjusted: ${input.name} ${adjustment > 0 ? '+' : ''}${adjustment} ${input.unit} (${reason})`
    );

    return input;
  }
}

export const stockService = new StockService();
export default stockService;

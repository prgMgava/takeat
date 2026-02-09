import { Transaction } from 'sequelize';
import {
  sequelize,
  Order,
  OrderItem,
  OrderItemOption,
  Restaurant,
  Product,
  ProductOption,
  OptionItem,
} from '../models';
import { AppError } from '../middlewares/error.middleware';
import { stockService, OrderItemForStock } from './stock.service';
import logger from '../utils/logger';
import { OrderStatus } from '../types';

interface OptionSelection {
  optionId: string;
  itemIds?: string[];
}

interface OrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
  options?: OptionSelection[];
}

export interface CreateOrderInput {
  restaurantId: string;
  customerId: string;
  items: OrderItemInput[];
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZipCode?: string;
  deliveryPhone?: string;
  notes?: string;
}

interface ProcessedOrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  selectedOptions: Array<{
    optionName: string;
    itemName: string;
    itemPrice: number;
  }>;
}


const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TK${timestamp}${random}`;
};

class OrderService {
  async validateRestaurant(restaurantId: string): Promise<Restaurant> {
    const restaurant = await Restaurant.findByPk(restaurantId);

    if (!restaurant || !restaurant.isActive) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    if (!restaurant.isOpen) {
      throw new AppError('Restaurante está fechado no momento', 400, 'RESTAURANT_CLOSED');
    }

    return restaurant;
  }

  async processOrderItems(
    items: OrderItemInput[],
    restaurantId: string
  ): Promise<{ processedItems: ProcessedOrderItem[]; subtotal: number }> {
    let subtotal = 0;
    const processedItems: ProcessedOrderItem[] = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        include: [
          {
            model: ProductOption,
            as: 'options',
            include: [{ model: OptionItem, as: 'items' }],
          },
        ],
      });

      if (!product || !product.isActive || product.restaurantId !== restaurantId) {
        throw new AppError(`Produto não encontrado: ${item.productId}`, 404, 'PRODUCT_NOT_FOUND');
      }

      if (!product.isAvailable) {
        throw new AppError(`Produto indisponível: ${product.name}`, 400, 'PRODUCT_UNAVAILABLE');
      }

      const unitPrice = product.price;
      let itemTotal = unitPrice * item.quantity;

      const selectedOptions: ProcessedOrderItem['selectedOptions'] = [];

      if (item.options && Array.isArray(item.options)) {
        const productWithOptions = product as Product & {
          options: Array<ProductOption & { items: OptionItem[] }>;
        };

        for (const optionSelection of item.options) {
          const productOption = productWithOptions.options.find(
            (o) => o.id === optionSelection.optionId
          );

          if (!productOption) {
            throw new AppError(
              `Opção não encontrada: ${optionSelection.optionId}`,
              404,
              'OPTION_NOT_FOUND'
            );
          }

          const selectedCount = optionSelection.itemIds?.length || 0;

          if (productOption.isRequired && selectedCount < productOption.minSelections) {
            throw new AppError(
              `Opção "${productOption.name}" requer pelo menos ${productOption.minSelections} seleção(ões)`,
              400,
              'INVALID_SELECTION'
            );
          }

          if (selectedCount > productOption.maxSelections) {
            throw new AppError(
              `Opção "${productOption.name}" permite no máximo ${productOption.maxSelections} seleção(ões)`,
              400,
              'INVALID_SELECTION'
            );
          }

          if (optionSelection.itemIds && Array.isArray(optionSelection.itemIds)) {
            for (const itemId of optionSelection.itemIds) {
              const optionItem = productOption.items.find((i) => i.id === itemId);

              if (!optionItem) {
                throw new AppError(
                  `Item de opção não encontrado: ${itemId}`,
                  404,
                  'OPTION_ITEM_NOT_FOUND'
                );
              }

              itemTotal += optionItem.price * item.quantity;
              selectedOptions.push({
                optionName: productOption.name,
                itemName: optionItem.name,
                itemPrice: optionItem.price,
              });
            }
          }
        }
      }

      subtotal += itemTotal;
      processedItems.push({
        productId: product.id,
        productName: product.name,
        productPrice: unitPrice,
        quantity: item.quantity,
        subtotal: itemTotal,
        notes: item.notes,
        selectedOptions,
      });
    }

    return { processedItems, subtotal };
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const transaction = await sequelize.transaction();

    try {
      const restaurant = await this.validateRestaurant(input.restaurantId);

      const { processedItems, subtotal } = await this.processOrderItems(
        input.items,
        input.restaurantId
      );


      if (subtotal < restaurant.minOrderValue) {
        throw new AppError(
          `Pedido mínimo é R$ ${restaurant.minOrderValue.toFixed(2)}`,
          400,
          'MINIMUM_ORDER_NOT_MET'
        );
      }

      const deliveryFee = restaurant.deliveryFee;
      const total = subtotal + deliveryFee;


      const itemsForStock: OrderItemForStock[] = processedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
      }));


      await stockService.validateAndDecrementStock(itemsForStock, transaction);


      const order = await Order.create(
        {
          orderNumber: generateOrderNumber(),
          customerId: input.customerId,
          restaurantId: input.restaurantId,
          subtotal,
          deliveryFee,
          total,
          deliveryAddress: input.deliveryAddress ?? '',
          deliveryCity: input.deliveryCity ?? '',
          deliveryState: input.deliveryState ?? '',
          deliveryZipCode: input.deliveryZipCode ?? '',
          deliveryPhone: input.deliveryPhone ?? '',
          notes: input.notes,
        },
        { transaction }
      );


      for (const item of processedItems) {
        const orderItem = await OrderItem.create(
          {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            notes: item.notes,
          },
          { transaction }
        );


        for (const option of item.selectedOptions) {
          await OrderItemOption.create(
            {
              orderItemId: orderItem.id,
              optionName: option.optionName,
              itemName: option.itemName,
              itemPrice: option.itemPrice,
            },
            { transaction }
          );
        }
      }


      await transaction.commit();

      logger.info(`[OrderService] Order created: ${order.orderNumber} by user ${input.customerId}`);


      const createdOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name', 'phone', 'address'],
          },
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: OrderItemOption, as: 'options' }],
          },
        ],
      });

      return createdOrder!;
    } catch (error) {

      await transaction.rollback();
      logger.error(`[OrderService] Order creation failed: ${(error as Error).message}`);
      throw error;
    }
  }


  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    userRole: string
  ): Promise<Order> {
    const order = await Order.findByPk(orderId, {
      include: [{ model: Restaurant, as: 'restaurant' }],
    });

    if (!order) {
      throw new AppError('Pedido não encontrado', 404, 'ORDER_NOT_FOUND');
    }


    const orderWithIncludes = order as Order & { restaurant?: Restaurant };
    const restaurant = orderWithIncludes.restaurant;
    const isOwner = restaurant?.ownerId === userId;
    const isAdmin = userRole === 'ADMIN';
    const isCustomer = order.customerId === userId;


    if (!isOwner && !isAdmin && !isCustomer) {
      throw new AppError('Sem permissão para atualizar este pedido', 403, 'FORBIDDEN');
    }


    if (isCustomer && !isOwner && !isAdmin) {
      if (newStatus !== 'CANCELLED') {
        throw new AppError('Cliente só pode cancelar pedidos', 403, 'FORBIDDEN');
      }
      if (order.status !== 'PENDING') {
        throw new AppError('Pedido já está em andamento e não pode ser cancelado', 400, 'ORDER_IN_PROGRESS');
      }
    }


    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status as OrderStatus].includes(newStatus)) {
      throw new AppError(
        `Não é possível mudar de ${order.status} para ${newStatus}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }


    if (newStatus === 'CANCELLED') {
      const orderItems = await OrderItem.findAll({
        where: { orderId },
      });

      const itemsForStock: OrderItemForStock[] = orderItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
      }));

      await stockService.revertStockDecrement(itemsForStock);
    }

    await order.update({ status: newStatus });

    logger.info(`[OrderService] Order ${order.orderNumber} status changed to ${newStatus}`);

    return order;
  }


  async findOrders(filters: {
    customerId?: string;
    restaurantId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { customerId, restaurantId, status, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};
    if (customerId) whereClause.customerId = customerId;
    if (restaurantId) whereClause.restaurantId = restaurantId;
    if (status) whereClause.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logoUrl'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: OrderItemOption, as: 'options' }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      orders: rows,
      total: count,
      page,
      limit,
    };
  }
}

export const orderService = new OrderService();
export default orderService;

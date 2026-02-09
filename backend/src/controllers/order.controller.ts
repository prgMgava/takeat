import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import {
  Order,
  OrderItem,
  OrderItemOption,
  Restaurant,
  User,
} from '../models';
import { AppError } from '../middlewares/error.middleware';
import { orderService } from '../services';
import logger from '../utils/logger';
import { OrderStatus } from '../types';




export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryZipCode,
      deliveryPhone,
      notes,
    } = req.body;


    const order = await orderService.createOrder({
      restaurantId,
      customerId: req.user!.id,
      items,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryZipCode,
      deliveryPhone,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};


export const findAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      restaurantId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: Record<string, unknown> = {};


    if (req.user!.role === 'CUSTOMER') {
      where.customerId = req.user!.id;
    } else if (req.user!.role === 'RESTAURANT_OWNER') {
      const restaurant = await Restaurant.findOne({
        where: { ownerId: req.user!.id },
      });
      if (restaurant) {
        where.restaurantId = restaurant.id;
      } else {
        res.json({
          success: true,
          data: {
            orders: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit as string),
            },
          },
        });
        return;
      }
    } else if (restaurantId && req.user!.role === 'ADMIN') {
      where.restaurantId = restaurantId;
    }

    if (status) {
      where.status = status;
    }


    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>)[Op.gte as unknown as string] = new Date(startDate as string);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>)[Op.lte as unknown as string] = new Date(endDate as string);
      }
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset,
      order: [[sortBy as string, (sortOrder as string).toUpperCase()]],
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logoUrl'],
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: OrderItemOption, as: 'options' }],
        },
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit as string),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const findOne = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'phone', 'address', 'logoUrl'],
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: OrderItemOption, as: 'options' }],
        },
      ],
    });

    if (!order) {
      throw new AppError('Pedido não encontrado', 404, 'ORDER_NOT_FOUND');
    }

    // Verificar permissão de acesso
    if (req.user!.role !== 'ADMIN' && order.customerId !== req.user!.id) {
      const restaurant = await Restaurant.findByPk(order.restaurantId);
      if (!restaurant || restaurant.ownerId !== req.user!.id) {
        throw new AppError('Você não tem permissão para ver este pedido', 403, 'FORBIDDEN');
      }
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualiza status do pedido
 * PATCH /orders/:id/status
 */
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('Pedido não encontrado', 404, 'ORDER_NOT_FOUND');
    }

    // Verificar permissão
    if (req.user!.role !== 'ADMIN' && order.customerId !== req.user!.id) {
      const restaurant = await Restaurant.findByPk(order.restaurantId);
      if (!restaurant || restaurant.ownerId !== req.user!.id) {
        throw new AppError('Você não tem permissão para atualizar este pedido', 403, 'FORBIDDEN');
      }
    }

    // Validar transição de status
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['OUT_FOR_DELIVERY', 'DELIVERED'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new AppError(
        `Transição de status inválida: ${order.status} -> ${status}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Timestamps por status
    interface StatusTimestamps {
      confirmedAt?: Date;
      preparingAt?: Date;
      readyAt?: Date;
      outForDeliveryAt?: Date;
      deliveredAt?: Date;
      cancelledAt?: Date;
    }
    const statusTimestamps: StatusTimestamps = {};
    const now = new Date();

    switch (status as OrderStatus) {
      case 'CONFIRMED':
        statusTimestamps.confirmedAt = now;
        break;
      case 'PREPARING':
        statusTimestamps.preparingAt = now;
        break;
      case 'READY':
        statusTimestamps.readyAt = now;
        break;
      case 'OUT_FOR_DELIVERY':
        statusTimestamps.outForDeliveryAt = now;
        break;
      case 'DELIVERED':
        statusTimestamps.deliveredAt = now;
        break;
      case 'CANCELLED':
        statusTimestamps.cancelledAt = now;
        break;
    }

    await order.update({
      status,
      ...statusTimestamps,
    });

    logger.info(`Order ${order.orderNumber} status updated to ${status}`);

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancela um pedido
 * POST /orders/:id/cancel
 */
export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('Pedido não encontrado', 404, 'ORDER_NOT_FOUND');
    }

    // Verificar permissão
    if (req.user!.role !== 'ADMIN' && order.customerId !== req.user!.id) {
      const restaurant = await Restaurant.findByPk(order.restaurantId);
      if (!restaurant || restaurant.ownerId !== req.user!.id) {
        throw new AppError('Você não tem permissão para cancelar este pedido', 403, 'FORBIDDEN');
      }
    }

    // Só pode cancelar se pendente ou confirmado
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new AppError('Este pedido não pode mais ser cancelado', 400, 'CANNOT_CANCEL');
    }

    await order.update({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    logger.info(`Order ${order.orderNumber} cancelled by user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  findAll,
  findOne,
  updateStatus,
  cancel,
};

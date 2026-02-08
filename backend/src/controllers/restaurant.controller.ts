import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Restaurant, Category, Product, User } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      cuisine,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      logoUrl,
      bannerUrl,
      deliveryFee,
      minOrderValue,
      estimatedDeliveryTime,
    } = req.body;

    // Check if user already owns a restaurant
    const existingRestaurant = await Restaurant.findOne({
      where: { ownerId: req.user!.id },
    });

    if (existingRestaurant) {
      throw new AppError('Você já possui um restaurante cadastrado', 409, 'RESTAURANT_EXISTS');
    }

    const restaurant = await Restaurant.create({
      ownerId: req.user!.id,
      name,
      description,
      cuisine,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      logoUrl,
      bannerUrl,
      deliveryFee: deliveryFee || 0,
      minOrderValue: minOrderValue || 0,
      estimatedDeliveryTime: estimatedDeliveryTime || 45,
    });

    logger.info(`Restaurant created: ${name} by user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      message: 'Restaurante criado com sucesso',
      data: { restaurant },
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
      search,
      cuisine,
      isOpen,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { cuisine: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (cuisine) {
      where.cuisine = { [Op.iLike]: `%${cuisine}%` };
    }

    if (isOpen !== undefined) {
      where.isOpen = isOpen === 'true';
    }

    const { count, rows: restaurants } = await Restaurant.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset,
      order: [[sortBy as string, (sortOrder as string).toUpperCase()]],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        restaurants,
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

    const restaurant = await Restaurant.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Category,
          as: 'categories',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Product,
              as: 'products',
              where: { isActive: true },
              required: false,
            },
          ],
        },
      ],
    });

    if (!restaurant) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

export const findMyRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({
      where: { ownerId: req.user!.id },
      include: [
        {
          model: Category,
          as: 'categories',
          include: [
            {
              model: Product,
              as: 'products',
            },
          ],
        },
      ],
    });

    if (!restaurant) {
      throw new AppError('Você não possui um restaurante cadastrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    // Check ownership
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para editar este restaurante', 403, 'FORBIDDEN');
    }

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.ownerId;

    await restaurant.update(updateData);

    logger.info(`Restaurant updated: ${restaurant.name} (${id})`);

    res.json({
      success: true,
      message: 'Restaurante atualizado com sucesso',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    // Check ownership
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para alterar este restaurante', 403, 'FORBIDDEN');
    }

    await restaurant.update({ isOpen: !restaurant.isOpen });

    res.json({
      success: true,
      message: `Restaurante ${restaurant.isOpen ? 'aberto' : 'fechado'} com sucesso`,
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    // Check ownership
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para excluir este restaurante', 403, 'FORBIDDEN');
    }

    // Soft delete
    await restaurant.update({ isActive: false });

    logger.info(`Restaurant deleted: ${restaurant.name} (${id})`);

    res.json({
      success: true,
      message: 'Restaurante excluído com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  findAll,
  findOne,
  findMyRestaurant,
  update,
  toggleStatus,
  delete: remove,
};

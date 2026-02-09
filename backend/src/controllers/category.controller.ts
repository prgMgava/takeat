import { Request, Response, NextFunction } from 'express';
import { Category, Restaurant, Product } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId, name, description, sortOrder } = req.body;

    // Verify restaurant ownership
    const restaurant = await Restaurant.findByPk(restaurantId);

      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para adicionar categorias a este restaurante', 403, 'FORBIDDEN');
    }

    const category = await Category.create({
      restaurantId,
      name,
      description,
      sortOrder: sortOrder || 0,
    });

    logger.info(`Category created: ${name} for restaurant ${restaurantId}`);

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const findByRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    const categories = await Category.findAll({
      where: { restaurantId, isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      include: [
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      data: { categories },
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

    const category = await Category.findOne({

      include: [
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false,
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'ownerId'],
        },
      ],
    });

    if (!category) {
      throw new AppError('Categoria não encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { category },
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
    const { name, description, sortOrder, isActive } = req.body;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'ownerId'],
        },
      ],
    });

    if (!category) {
      throw new AppError('Categoria não encontrada', 404, 'CATEGORY_NOT_FOUND');
    }


    const restaurant = (category as Category & { restaurant: Restaurant }).restaurant;
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para editar esta categoria', 403, 'FORBIDDEN');
    }


      name: name ?? category.name,
      description: description ?? category.description,
      sortOrder: sortOrder ?? category.sortOrder,
      isActive: isActive ?? category.isActive,
    });

    logger.info(`Category updated: ${category.name} (${id})`);

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction

  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'ownerId'],

      ],
    });

    if (!category) {
      throw new AppError('Categoria não encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check ownership
    const restaurant = (category as Category & { restaurant: Restaurant }).restaurant;
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para excluir esta categoria', 403, 'FORBIDDEN');
    }

    // Soft delete
    await category.update({ isActive: false });

    logger.info(`Category deleted: ${category.name} (${id})`);

    res.json({
      success: true,
      message: 'Categoria excluída com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reordena categorias de um restaurante
 * POST /categories/reorder
 */
export const reorder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId, categories } = req.body;

    // Verificar permissão do restaurante
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para reordenar categorias', 403, 'FORBIDDEN');
    }

    // Atualizar sortOrder de cada categoria
    for (const cat of categories) {
      await Category.update(
        { sortOrder: cat.sortOrder },
        { where: { id: cat.id, restaurantId } }
      );
    }

    logger.info(`Categories reordered for restaurant ${restaurantId}`);

    res.json({
      success: true,
      message: 'Categorias reordenadas com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  findByRestaurant,
  findOne,
  update,
  delete: remove,
  reorder,
};

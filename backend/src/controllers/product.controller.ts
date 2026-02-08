import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Product, ProductOption, OptionItem, Restaurant, Category } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';

interface OptionInput {
  name: string;
  description?: string;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  items?: Array<{
    name: string;
    price?: number;
  }>;
}

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      sortOrder,
      options,
    } = req.body;

    // Verify restaurant ownership
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para adicionar produtos a este restaurante', 403, 'FORBIDDEN');
    }

    // Verify category belongs to restaurant
    const category = await Category.findOne({
      where: { id: categoryId, restaurantId },
    });
    if (!category) {
      throw new AppError('Categoria não encontrada neste restaurante', 404, 'CATEGORY_NOT_FOUND');
    }

    const product = await Product.create({
      restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      sortOrder: sortOrder || 0,
    });

    // Create options if provided
    if (options && Array.isArray(options)) {
      for (const option of options as OptionInput[]) {
        const productOption = await ProductOption.create({
          productId: product.id,
          name: option.name,
          description: option.description,
          isRequired: option.isRequired || false,
          minSelections: option.minSelections || 0,
          maxSelections: option.maxSelections || 1,
        });

        if (option.items && Array.isArray(option.items)) {
          for (const item of option.items) {
            await OptionItem.create({
              optionId: productOption.id,
              name: item.name,
              price: item.price || 0,
            });
          }
        }
      }
    }

    // Fetch product with options
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: ProductOption,
          as: 'options',
          include: [{ model: OptionItem, as: 'items' }],
        },
      ],
    });

    logger.info(`Product created: ${name} for restaurant ${restaurantId}`);

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: { product: createdProduct },
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
    const { categoryId, search, isAvailable, page = '1', limit = '50' } = req.query;

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: Record<string, unknown> = { restaurantId, isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: ProductOption,
          as: 'options',
          include: [{ model: OptionItem, as: 'items' }],
        },
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        products,
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

    const product = await Product.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logoUrl', 'isOpen'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: ProductOption,
          as: 'options',
          include: [{ model: OptionItem, as: 'items' }],
        },
      ],
    });

    if (!product) {
      throw new AppError('Produto não encontrado', 404, 'PRODUCT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { product },
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

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'ownerId'],
        },
      ],
    });

    if (!product) {
      throw new AppError('Produto não encontrado', 404, 'PRODUCT_NOT_FOUND');
    }

    // Check ownership
    const restaurant = (product as Product & { restaurant: Restaurant }).restaurant;
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para editar este produto', 403, 'FORBIDDEN');
    }

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.restaurantId;

    await product.update(updateData);

    logger.info(`Product updated: ${product.name} (${id})`);

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: { product },
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

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'ownerId'],
        },
      ],
    });

    if (!product) {
      throw new AppError('Produto não encontrado', 404, 'PRODUCT_NOT_FOUND');
    }

    // Check ownership
    const restaurant = (product as Product & { restaurant: Restaurant }).restaurant;
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para excluir este produto', 403, 'FORBIDDEN');
    }

    // Soft delete
    await product.update({ isActive: false });

    logger.info(`Product deleted: ${product.name} (${id})`);

    res.json({
      success: true,
      message: 'Produto excluído com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'ownerId'],
        },
      ],
    });

    if (!product) {
      throw new AppError('Produto não encontrado', 404, 'PRODUCT_NOT_FOUND');
    }

    // Check ownership
    const restaurant = (product as Product & { restaurant: Restaurant }).restaurant;
    if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Você não tem permissão para alterar este produto', 403, 'FORBIDDEN');
    }

    await product.update({ isAvailable: !product.isAvailable });

    res.json({
      success: true,
      message: `Produto ${product.isAvailable ? 'disponibilizado' : 'indisponibilizado'} com sucesso`,
      data: { product },
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
  toggleAvailability,
};

import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { sequelize, Input, ProductInput, Product, Restaurant } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';


export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId, name, description, unit, stockQuantity, minStock, costPerUnit } = req.body;


    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurante não encontrado', 404, 'RESTAURANT_NOT_FOUND');
    }

    if (req.user!.role !== 'ADMIN' && restaurant.ownerId !== req.user!.id) {
      throw new AppError('Sem permissão para este restaurante', 403, 'FORBIDDEN');
    }


    const existing = await Input.findOne({
      where: { restaurantId, name: { [Op.iLike]: name } },
    });
    if (existing) {
      throw new AppError('Já existe um insumo com este nome', 400, 'INPUT_EXISTS');
    }

    const input = await Input.create({
      restaurantId,
      name,
      description,
      unit: unit || 'un',
      stockQuantity: stockQuantity || 0,
      minStock: minStock || 0,
      costPerUnit: costPerUnit || 0,
    });

    logger.info(`Input created: ${input.name} for restaurant ${restaurantId}`);

    res.status(201).json({
      success: true,
      message: 'Insumo criado com sucesso',
      data: { input },
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
    const { page = '1', limit = '50', search, lowStock } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const whereClause: Record<string, unknown> = { restaurantId, isActive: true };

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const inputs = await Input.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit as string),
      offset,
      order: [['name', 'ASC']],
    });


    let items = inputs.rows;
    if (lowStock === 'true') {
      items = inputs.rows.filter(input => input.stockQuantity <= input.minStock);
    }

    res.json({
      success: true,
      data: {
        inputs: items,
        total: lowStock === 'true' ? items.length : inputs.count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
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

    const input = await Input.findByPk(id, {
      include: [
        {
          model: ProductInput,
          as: 'productInputs',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
        },
      ],
    });

    if (!input) {
      throw new AppError('Insumo não encontrado', 404, 'INPUT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { input },
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
    const { name, description, unit, stockQuantity, minStock, costPerUnit, isActive } = req.body;

    const input = await Input.findByPk(id, {
      include: [{ model: Restaurant, as: 'restaurant' }],
    });

    if (!input) {
      throw new AppError('Insumo não encontrado', 404, 'INPUT_NOT_FOUND');
    }

    const restaurant = (input as Input & { restaurant: Restaurant }).restaurant;

    if (req.user!.role !== 'ADMIN' && restaurant.ownerId !== req.user!.id) {
      throw new AppError('Sem permissão para este insumo', 403, 'FORBIDDEN');
    }


    if (name && name !== input.name) {
      const existing = await Input.findOne({
        where: {
          restaurantId: input.restaurantId,
          name: { [Op.iLike]: name },
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw new AppError('Já existe um insumo com este nome', 400, 'INPUT_EXISTS');
      }
    }

    await input.update({
      name: name ?? input.name,
      description: description ?? input.description,
      unit: unit ?? input.unit,
      stockQuantity: stockQuantity ?? input.stockQuantity,
      minStock: minStock ?? input.minStock,
      costPerUnit: costPerUnit ?? input.costPerUnit,
      isActive: isActive ?? input.isActive,
    });

    logger.info(`Input updated: ${input.name}`);

    res.json({
      success: true,
      message: 'Insumo atualizado com sucesso',
      data: { input },
    });
  } catch (error) {
    next(error);
  }
};


export const adjustStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body;

    const input = await Input.findByPk(id, {
      include: [{ model: Restaurant, as: 'restaurant' }],
    });

    if (!input) {
      throw new AppError('Insumo não encontrado', 404, 'INPUT_NOT_FOUND');
    }

    const restaurant = (input as Input & { restaurant: Restaurant }).restaurant;

    if (req.user!.role !== 'ADMIN' && restaurant.ownerId !== req.user!.id) {
      throw new AppError('Sem permissão para este insumo', 403, 'FORBIDDEN');
    }

    const adjustQuantity = parseFloat(quantity);
    let newQuantity = input.stockQuantity;

    if (operation === 'add') {
      newQuantity += adjustQuantity;
    } else if (operation === 'remove') {
      newQuantity -= adjustQuantity;
      if (newQuantity < 0) {
        throw new AppError('Quantidade insuficiente em estoque', 400, 'INSUFFICIENT_STOCK');
      }
    } else {
      throw new AppError('Operação inválida. Use "add" ou "remove"', 400, 'INVALID_OPERATION');
    }

    await input.update({ stockQuantity: newQuantity });

    logger.info(
      `Stock adjusted for ${input.name}: ${operation} ${adjustQuantity} ${input.unit}. ` +
      `New quantity: ${newQuantity}. Reason: ${reason || 'N/A'}`
    );

    res.json({
      success: true,
      message: `Estoque ${operation === 'add' ? 'adicionado' : 'removido'} com sucesso`,
      data: {
        input,
        adjustment: {
          operation,
          quantity: adjustQuantity,
          previousQuantity: input.stockQuantity - (operation === 'add' ? adjustQuantity : -adjustQuantity),
          newQuantity,
          reason,
        },
      },
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

    const input = await Input.findByPk(id, {
      include: [{ model: Restaurant, as: 'restaurant' }],
    });

    if (!input) {
      throw new AppError('Insumo não encontrado', 404, 'INPUT_NOT_FOUND');
    }

    const restaurant = (input as Input & { restaurant: Restaurant }).restaurant;

    if (req.user!.role !== 'ADMIN' && restaurant.ownerId !== req.user!.id) {
      throw new AppError('Sem permissão para este insumo', 403, 'FORBIDDEN');
    }


    await input.update({ isActive: false });

    logger.info(`Input deleted: ${input.name}`);

    res.json({
      success: true,
      message: 'Insumo removido com sucesso',
    });
  } catch (error) {
    next(error);
  }
};


export const setProductInputs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const { productId } = req.params;
    const { inputs } = req.body;

    const product = await Product.findByPk(productId, {
      include: [{ model: Restaurant, as: 'restaurant' }],
    });

    if (!product) {
      throw new AppError('Produto não encontrado', 404, 'PRODUCT_NOT_FOUND');
    }

    const restaurant = (product as Product & { restaurant: Restaurant }).restaurant;

    if (req.user!.role !== 'ADMIN' && restaurant.ownerId !== req.user!.id) {
      throw new AppError('Sem permissão para este produto', 403, 'FORBIDDEN');
    }


    await ProductInput.destroy({
      where: { productId },
      transaction,
    });


    const productInputs = [];
    for (const item of inputs) {
      const input = await Input.findOne({
        where: { id: item.inputId, restaurantId: product.restaurantId },
      });

      if (!input) {
        throw new AppError(`Insumo não encontrado: ${item.inputId}`, 404, 'INPUT_NOT_FOUND');
      }

      const productInput = await ProductInput.create(
        {
          productId,
          inputId: item.inputId,
          quantity: item.quantity,
        },
        { transaction }
      );

      productInputs.push({
        ...productInput.toJSON(),
        input: { id: input.id, name: input.name, unit: input.unit },
      });
    }

    await transaction.commit();

    logger.info(`Product inputs set for product ${product.name}`);

    res.json({
      success: true,
      message: 'Ficha técnica atualizada com sucesso',
      data: { productInputs },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};


export const getProductInputs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductInput,
          as: 'inputs',
          include: [{ model: Input, as: 'input' }],
        },
      ],
    });

    if (!product) {
      throw new AppError('Produto não encontrado', 404, 'PRODUCT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
        },
        inputs: (product as Product & { inputs: (ProductInput & { input: Input })[] }).inputs.map(pi => ({
          inputId: pi.inputId,
          inputName: pi.input.name,
          unit: pi.input.unit,
          quantity: pi.quantity,
          stockAvailable: pi.input.stockQuantity,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};


export const checkStockAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items } = req.body;

    const stockStatus: Array<{
      productId: string;
      productName: string;
      available: boolean;
      missingInputs: Array<{
        inputName: string;
        required: number;
        available: number;
        unit: string;
      }>;
    }> = [];

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
          available: false,
          missingInputs: [],
        });
        continue;
      }

      const missingInputs: Array<{
        inputName: string;
        required: number;
        available: number;
        unit: string;
      }> = [];

      const productWithInputs = product as Product & { inputs: (ProductInput & { input: Input })[] };

      for (const pi of productWithInputs.inputs) {
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
        available: missingInputs.length === 0,
        missingInputs,
      });
    }

    const allAvailable = stockStatus.every(s => s.available);

    res.json({
      success: true,
      data: {
        allAvailable,
        products: stockStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

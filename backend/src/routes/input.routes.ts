import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as inputController from '../controllers/input.controller';
import { authMiddleware, requireRole, validate } from '../middlewares';

const router = Router();

// Validation rules
const createInputValidation = [
  body('restaurantId').isUUID().withMessage('ID do restaurante inválido'),
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('description').optional().trim(),
  body('unit').optional().trim().isLength({ max: 50 }).withMessage('Unidade deve ter no máximo 50 caracteres'),
  body('stockQuantity').optional().isDecimal().withMessage('Quantidade em estoque deve ser um número'),
  body('minStock').optional().isDecimal().withMessage('Estoque mínimo deve ser um número'),
  body('costPerUnit').optional().isDecimal().withMessage('Custo por unidade deve ser um número'),
];

const updateInputValidation = [
  body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
  body('description').optional().trim(),
  body('unit').optional().trim().isLength({ max: 50 }).withMessage('Unidade deve ter no máximo 50 caracteres'),
  body('stockQuantity').optional().isDecimal().withMessage('Quantidade em estoque deve ser um número'),
  body('minStock').optional().isDecimal().withMessage('Estoque mínimo deve ser um número'),
  body('costPerUnit').optional().isDecimal().withMessage('Custo por unidade deve ser um número'),
  body('isActive').optional().isBoolean(),
];

const adjustStockValidation = [
  body('quantity').isDecimal({ decimal_digits: '0,3' }).withMessage('Quantidade deve ser um número'),
  body('operation').isIn(['add', 'remove']).withMessage('Operação deve ser "add" ou "remove"'),
  body('reason').optional().trim(),
];

const setProductInputsValidation = [
  body('inputs').isArray({ min: 0 }).withMessage('Inputs deve ser um array'),
  body('inputs.*.inputId').isUUID().withMessage('ID do insumo inválido'),
  body('inputs.*.quantity').isDecimal({ decimal_digits: '0,3' }).withMessage('Quantidade deve ser um número'),
];

const checkStockValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items deve ser um array com pelo menos 1 item'),
  body('items.*.productId').isUUID().withMessage('ID do produto inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser um número inteiro positivo'),
];

const listValidation = [
  query('search').optional().trim(),
  query('lowStock').optional().isBoolean().withMessage('lowStock deve ser true ou false'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

// Public route - check stock availability (no auth required)
router.post(
  '/check-stock',
  validate(checkStockValidation),
  inputController.checkStockAvailability
);

// All routes below require authentication
router.use(authMiddleware);

// List inputs for a restaurant
router.get(
  '/restaurant/:restaurantId',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  validate(listValidation),
  inputController.findByRestaurant
);

// Get product technical sheet (ficha técnica)
router.get(
  '/product/:productId',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  inputController.getProductInputs
);

// Set product technical sheet (ficha técnica)
router.put(
  '/product/:productId',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  validate(setProductInputsValidation),
  inputController.setProductInputs
);

// Get single input
router.get(
  '/:id',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  inputController.findOne
);

// Create input
router.post(
  '/',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  validate(createInputValidation),
  inputController.create
);

// Update input
router.put(
  '/:id',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  validate(updateInputValidation),
  inputController.update
);

// Adjust stock
router.post(
  '/:id/adjust-stock',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  validate(adjustStockValidation),
  inputController.adjustStock
);

// Delete input (soft delete)
router.delete(
  '/:id',
  requireRole('ADMIN', 'RESTAURANT_OWNER'),
  inputController.remove
);

export default router;

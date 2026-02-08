import { Router } from 'express';
import { body, query } from 'express-validator';
import * as productController from '../controllers/product.controller';
import { authMiddleware, requireRole, validate, optionalAuth } from '../middlewares';

const router = Router();

// Validation rules
const createProductValidation = [
  body('restaurantId').isUUID().withMessage('ID do restaurante inválido'),
  body('categoryId').optional().isUUID().withMessage('ID da categoria inválido'),
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('description').optional().trim(),
  body('price').isDecimal({ decimal_digits: '0,2' }).withMessage('Preço inválido'),
  body('promotionalPrice').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Preço promocional inválido'),
  body('imageUrl').optional().isURL().withMessage('URL da imagem inválida'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Tempo de preparo inválido'),
  body('servings').optional().isInt({ min: 1 }).withMessage('Porções inválidas'),
  body('options').optional().isArray(),
  body('options.*.name').optional().trim().notEmpty(),
  body('options.*.items').optional().isArray(),
];

const updateProductValidation = [
  body('categoryId').optional().isUUID().withMessage('ID da categoria inválido'),
  body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
  body('description').optional().trim(),
  body('price').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Preço inválido'),
  body('promotionalPrice').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Preço promocional inválido'),
  body('imageUrl').optional().isURL().withMessage('URL da imagem inválida'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Tempo de preparo inválido'),
  body('servings').optional().isInt({ min: 1 }).withMessage('Porções inválidas'),
  body('isAvailable').optional().isBoolean(),
  body('options').optional().isArray(),
];

const listValidation = [
  query('categoryId').optional().isUUID().withMessage('ID da categoria inválido'),
  query('search').optional().trim(),
  query('isAvailable').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

// Public routes
router.get('/restaurant/:restaurantId', optionalAuth, validate(listValidation), productController.findByRestaurant);
router.get('/:id', optionalAuth, productController.findOne);

// Protected routes
router.post(
  '/',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  validate(createProductValidation),
  productController.create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  validate(updateProductValidation),
  productController.update
);

router.patch(
  '/:id/toggle-availability',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  productController.toggleAvailability
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  productController.remove
);

export default router;

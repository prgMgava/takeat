import { Router } from 'express';
import { body } from 'express-validator';
import * as categoryController from '../controllers/category.controller';
import { authMiddleware, requireRole, validate, optionalAuth } from '../middlewares';

const router = Router();


const createCategoryValidation = [
  body('restaurantId').isUUID().withMessage('ID do restaurante inválido'),
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('description').optional().trim(),
  body('imageUrl').optional().isURL().withMessage('URL da imagem inválida'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Ordem inválida'),
];

const updateCategoryValidation = [
  body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
  body('description').optional().trim(),
  body('imageUrl').optional().isURL().withMessage('URL da imagem inválida'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Ordem inválida'),
  body('isActive').optional().isBoolean(),
];

const reorderValidation = [
  body('restaurantId').isUUID().withMessage('ID do restaurante inválido'),
  body('orderedIds').isArray().withMessage('Lista de IDs é obrigatória'),
  body('orderedIds.*').isUUID().withMessage('ID de categoria inválido'),
];


router.get('/restaurant/:restaurantId', optionalAuth, categoryController.findByRestaurant);
router.get('/:id', optionalAuth, categoryController.findOne);


router.post(
  '/',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  validate(createCategoryValidation),
  categoryController.create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  validate(updateCategoryValidation),
  categoryController.update
);

router.post(
  '/reorder',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  validate(reorderValidation),
  categoryController.reorder
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  categoryController.remove
);

export default router;

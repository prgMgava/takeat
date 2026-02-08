import { Router } from 'express';
import { body, query } from 'express-validator';
import * as orderController from '../controllers/order.controller';
import { authMiddleware, requireRole, validate } from '../middlewares';

const router = Router();

// Validation rules
// Using matches() instead of isUUID() for more lenient UUID validation
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createOrderValidation = [
  body('restaurantId').matches(uuidPattern).withMessage('ID do restaurante inválido'),
  body('items').isArray({ min: 1 }).withMessage('Itens são obrigatórios'),
  body('items.*.productId').matches(uuidPattern).withMessage('ID do produto inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade inválida'),
  body('items.*.options').optional().isArray(),
  body('items.*.notes').optional().trim(),
  body('paymentMethod')
    .optional()
    .isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX'])
    .withMessage('Método de pagamento inválido'),
  body('isDelivery').optional().isBoolean(),
  body('deliveryAddress').optional().trim(),
  body('notes').optional().trim(),
];

const updateStatusValidation = [
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
    .withMessage('Status inválido'),
  body('cancellationReason').optional().trim(),
];

const cancelOrderValidation = [
  body('reason').optional().trim(),
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  query('restaurantId').optional().matches(uuidPattern),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
];

// All routes require authentication
router.use(authMiddleware);

// Customer routes
router.post('/', validate(createOrderValidation), orderController.create);
router.get('/', validate(listValidation), orderController.findAll);
router.get('/:id', orderController.findOne);
router.post('/:id/cancel', validate(cancelOrderValidation), orderController.cancel);

// Restaurant owner routes
router.patch(
  '/:id/status',
  requireRole('RESTAURANT_OWNER', 'ADMIN'),
  validate(updateStatusValidation),
  orderController.updateStatus
);

export default router;

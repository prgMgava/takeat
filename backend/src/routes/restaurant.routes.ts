import { Router } from 'express';
import { body, query } from 'express-validator';
import * as restaurantController from '../controllers/restaurant.controller';
import { authMiddleware, requireRole, validate, optionalAuth } from '../middlewares';

const router = Router();

const createRestaurantValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('description').optional(),
  body('cuisine').optional(),
  body('phone').optional(),
  body('deliveryFee').optional().isDecimal().withMessage('Delivery fee must be a decimal'),
  body('minimumOrder').optional().isDecimal().withMessage('Minimum order must be a decimal'),
];

const updateRestaurantValidation = [
  body('name').optional(),
  body('address').optional(),
  body('description').optional(),
  body('cuisine').optional(),
  body('phone').optional(),
  body('deliveryFee').optional().isDecimal().withMessage('Delivery fee must be a decimal'),
  body('minimumOrder').optional().isDecimal().withMessage('Minimum order must be a decimal'),
  body('isOpen').optional().isBoolean().withMessage('isOpen must be a boolean'),
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be an integer >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
  query('search').optional(),
  query('cuisine').optional(),
  query('isOpen').optional().isBoolean().withMessage('isOpen must be a boolean'),
];

router.get('/', optionalAuth, validate(listValidation), restaurantController.findAll);
router.get('/owner/me', authMiddleware, requireRole('RESTAURANT_OWNER', 'ADMIN'), restaurantController.findMyRestaurant);
router.get('/:id', optionalAuth, restaurantController.findOne);
router.post('/', authMiddleware, requireRole('RESTAURANT_OWNER', 'ADMIN'), validate(createRestaurantValidation), restaurantController.create);
router.put('/:id', authMiddleware, requireRole('RESTAURANT_OWNER', 'ADMIN'), validate(updateRestaurantValidation), restaurantController.update);
router.patch('/:id/toggle-status', authMiddleware, requireRole('RESTAURANT_OWNER', 'ADMIN'), restaurantController.toggleStatus);
router.delete('/:id', authMiddleware, requireRole('RESTAURANT_OWNER', 'ADMIN'), restaurantController.remove);

export default router;

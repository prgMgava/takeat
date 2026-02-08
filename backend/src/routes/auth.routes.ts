import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { authMiddleware, validate, authLimiter } from '../middlewares';

const router = Router();

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('phone').optional(),
  body('role').optional().isIn(['CUSTOMER', 'RESTAURANT_OWNER']),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty(),
];

const updateProfileValidation = [
  body('name').optional().notEmpty(),
  body('phone').optional(),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
];

router.post('/register', authLimiter, validate(registerValidation), authController.register);
router.post('/login', authLimiter, validate(loginValidation), authController.login);
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.patch('/profile', authMiddleware, validate(updateProfileValidation), authController.updateProfile);
router.post('/change-password', authMiddleware, validate(changePasswordValidation), authController.changePassword);

export default router;

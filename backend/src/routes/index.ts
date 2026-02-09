import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import restaurantRoutes from './restaurant.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import inputRoutes from './input.routes';

const router = Router();


router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});


router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/inputs', inputRoutes);

export default router;

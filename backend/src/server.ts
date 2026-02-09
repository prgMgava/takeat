import 'dotenv/config';

import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import routes from './routes';
import { errorHandler, notFoundHandler, apiLimiter } from './middlewares';
import { sequelize } from './models';
import logger from './utils/logger';

const app: Application = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

app.use('/api', routes);
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Takeat API - Food Delivery System',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || '3001', 10);

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

startServer();

export default app;

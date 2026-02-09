import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string | null;
  isOperational: boolean;
  data: Record<string, unknown> | null;

  constructor(
    message: string,
    statusCode: number,
    code: string | null = null,
    data: Record<string, unknown> | null = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  success: boolean;
  message: string;
  code?: string | null;
  data?: Record<string, unknown> | null;
  stack?: string;
}

export const errorHandler = (
  err: Error & { statusCode?: number; code?: string | null; data?: Record<string, unknown> | null },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erro interno do servidor';
  let code = err.code || null;
  const data = err.data || null;


  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error:', {
      message: err.message,
      statusCode,
      path: req.path,
      method: req.method,
    });
  }


  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    const seqErr = err as Error & { errors: Array<{ message: string }> };
    message = seqErr.errors.map((e) => e.message).join(', ');
    code = 'VALIDATION_ERROR';
  }


  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const seqErr = err as Error & { errors: Array<{ path?: string }> };
    const field = seqErr.errors[0]?.path || 'campo';
    message = `${field} já está em uso`;
    code = 'DUPLICATE_ENTRY';
  }


  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referência inválida a um recurso inexistente';
    code = 'FOREIGN_KEY_ERROR';
  }


  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
    code = 'TOKEN_EXPIRED';
  }


  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (code) {
    response.code = code;
  }

  if (data) {
    response.data = data;
  }

  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    code: 'NOT_FOUND',
  });
};

export default {
  AppError,
  errorHandler,
  notFoundHandler,
};

import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { User, RefreshToken } from '../models';
import { UserRole, JwtPayload } from '../types';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      const user = await User.findByPk(decoded.sub, {
        attributes: { exclude: ['password'] },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo',
        });
      }

      req.user = user.toJSON();
      req.userId = user.id;
      next();
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      const user = await User.findByPk(decoded.sub, {
        attributes: { exclude: ['password'] },
      });

      if (user && user.isActive) {
        req.user = user.toJSON();
        req.userId = user.id;
      }
    } catch (error) {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.',
      });
    }

    next();
  };
};

export const requireOwnership = (
  getResourceOwnerId: (req: Request) => Promise<string | null>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticação necessária',
        });
      }

      if (req.user.role === 'ADMIN') {
        return next();
      }

      const ownerId = await getResourceOwnerId(req);

      if (ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você não tem permissão para este recurso.',
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões',
      });
    }
  };
};

export default {
  authMiddleware,
  optionalAuth,
  requireRole,
  requireOwnership,
};

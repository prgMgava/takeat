import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, RefreshToken } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';
import { JwtPayload } from '../types';

const generateTokens = async (user: User): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessTokenOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string & SignOptions['expiresIn'],
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string & SignOptions['expiresIn'],
  };

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    accessTokenOptions
  );

  const refreshToken = jwt.sign(
    { sub: user.id, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET!,
    refreshTokenOptions
  );

  // Calculate refresh token expiry
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const days = parseInt(refreshExpiresIn);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));

  // Save refresh token to database
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email já está em uso', 409, 'EMAIL_IN_USE');
    }

    // Only allow CUSTOMER role for public registration
    const userRole = role === 'RESTAURANT_OWNER' ? 'RESTAURANT_OWNER' : 'CUSTOMER';

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: userRole,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Conta desativada', 403, 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token não fornecido', 400, 'MISSING_TOKEN');
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    } catch (error) {
      throw new AppError('Refresh token inválido', 401, 'INVALID_TOKEN');
    }

    // Find token in database
    const storedToken = await RefreshToken.findOne({
      where: { token, isRevoked: false },
    });

    if (!storedToken) {
      throw new AppError('Refresh token não encontrado ou revogado', 401, 'TOKEN_REVOKED');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await storedToken.update({ isRevoked: true });
      throw new AppError('Refresh token expirado', 401, 'TOKEN_EXPIRED');
    }

    // Get user
    const user = await User.findByPk(decoded.sub);
    if (!user || !user.isActive) {
      throw new AppError('Conta desativada', 403, 'ACCOUNT_DISABLED');
    }

    // Revoke old refresh token
    await storedToken.update({ isRevoked: true });

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    res.json({
      success: true,
      message: 'Token atualizado com sucesso',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      // Revoke the refresh token
      await RefreshToken.update(
        { isRevoked: true },
        { where: { token } }
      );
    }

    // Revoke all user's refresh tokens (optional, for complete logout)
    if (req.user) {
      await RefreshToken.update(
        { isRevoked: true },
        { where: { userId: req.user.id, isRevoked: false } }
      );
    }

    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    await user.update({ name, phone });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new AppError('Senha atual incorreta', 400, 'INVALID_PASSWORD');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id, isRevoked: false } }
    );

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso. Faça login novamente.',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refreshToken: refreshTokenHandler,
  logout,
  me,
  updateProfile,
  changePassword,
};

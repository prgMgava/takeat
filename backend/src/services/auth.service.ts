import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { User, RefreshToken } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';
import { JwtPayload } from '../types';


export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN';
}


export interface LoginInput {
  email: string;
  password: string;
}


export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}


class AuthService {

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
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


    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const days = parseInt(refreshExpiresIn);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));


    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }


  async register(input: RegisterInput): Promise<AuthResponse> {

    const existingUser = await User.findOne({ where: { email: input.email } });
    if (existingUser) {
      throw new AppError('Email já está em uso', 409, 'EMAIL_IN_USE');
    }


    const userRole = input.role === 'RESTAURANT_OWNER' ? 'RESTAURANT_OWNER' : 'CUSTOMER';


    const user = await User.create({
      email: input.email,
      password: input.password,
      name: input.name,
      phone: input.phone,
      role: userRole,
    });


    const { accessToken, refreshToken } = await this.generateTokens(user);

    logger.info(`[AuthService] New user registered: ${input.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? undefined,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }


  async login(input: LoginInput): Promise<AuthResponse> {

    const user = await User.findOne({ where: { email: input.email } });
    if (!user) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }


    if (!user.isActive) {
      throw new AppError('Conta desativada', 403, 'ACCOUNT_DISABLED');
    }


    const isValidPassword = await user.validatePassword(input.password);
    if (!isValidPassword) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }


    const { accessToken, refreshToken } = await this.generateTokens(user);

    logger.info(`[AuthService] User logged in: ${input.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? undefined,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }


  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {

    const savedToken = await RefreshToken.findOne({
      where: { token, isRevoked: false },
      include: [{ model: User, as: 'user' }],
    });

    if (!savedToken) {
      throw new AppError('Refresh token inválido', 401, 'INVALID_REFRESH_TOKEN');
    }


    if (new Date() > savedToken.expiresAt) {
      await savedToken.update({ isRevoked: true });
      throw new AppError('Refresh token expirado', 401, 'TOKEN_EXPIRED');
    }


    try {
      jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    } catch {
      await savedToken.update({ isRevoked: true });
      throw new AppError('Refresh token inválido', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = (savedToken as RefreshToken & { user: User }).user;
    if (!user || !user.isActive) {
      throw new AppError('Usuário não encontrado ou inativo', 401, 'USER_INACTIVE');
    }


    await savedToken.update({ isRevoked: true });


    return this.generateTokens(user);
  }


  async revokeAllTokens(userId: string): Promise<void> {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId, isRevoked: false } }
    );

    logger.info(`[AuthService] All tokens revoked for user: ${userId}`);
  }


  async revokeToken(token: string): Promise<void> {
    const savedToken = await RefreshToken.findOne({ where: { token } });

    if (savedToken) {
      await savedToken.update({ isRevoked: true });
      logger.info(`[AuthService] Token revoked`);
    }
  }


  async getUserById(userId: string): Promise<User | null> {
    return User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
  }


  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }


    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new AppError('Email já está em uso', 409, 'EMAIL_IN_USE');
      }
    }

    await user.update(data);

    logger.info(`[AuthService] Profile updated for user: ${userId}`);

    return user;
  }


  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }


    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new AppError('Senha atual incorreta', 401, 'INVALID_PASSWORD');
    }


    await user.update({ password: newPassword });


    await this.revokeAllTokens(userId);

    logger.info(`[AuthService] Password changed for user: ${userId}`);
  }


  async cleanupExpiredTokens(): Promise<number> {
    const result = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          { isRevoked: true },
          { expiresAt: { [Op.lt]: new Date() } },
        ],
      },
    });

    logger.info(`[AuthService] Cleaned up ${result} expired tokens`);
    return result;
  }
}

export const authService = new AuthService();
export default authService;

import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { User, RefreshToken } from '../models';
import { AppError } from '../middlewares/error.middleware';
import logger from '../utils/logger';
import { JwtPayload } from '../types';

/**
 * Interface para dados de registro de usuário
 */
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN';
}

/**
 * Interface para dados de login
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Interface para resposta de autenticação
 */
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

/**
 * Service responsável pela autenticação e gerenciamento de tokens
 */
class AuthService {
  /**
   * Gera par de tokens (access + refresh)
   */
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

    // Calcular expiração do refresh token
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const days = parseInt(refreshExpiresIn);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));

    // Salvar refresh token no banco
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Registra novo usuário
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email: input.email } });
    if (existingUser) {
      throw new AppError('Email já está em uso', 409, 'EMAIL_IN_USE');
    }

    // Apenas CUSTOMER ou RESTAURANT_OWNER para registro público
    const userRole = input.role === 'RESTAURANT_OWNER' ? 'RESTAURANT_OWNER' : 'CUSTOMER';

    // Criar usuário
    const user = await User.create({
      email: input.email,
      password: input.password,
      name: input.name,
      phone: input.phone,
      role: userRole,
    });

    // Gerar tokens
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

  /**
   * Realiza login do usuário
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Buscar usuário
    const user = await User.findOne({ where: { email: input.email } });
    if (!user) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }

    // Verificar se conta está ativa
    if (!user.isActive) {
      throw new AppError('Conta desativada', 403, 'ACCOUNT_DISABLED');
    }

    // Verificar senha
    const isValidPassword = await user.validatePassword(input.password);
    if (!isValidPassword) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }

    // Gerar tokens
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

  /**
   * Renova tokens usando refresh token
   */
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verificar token no banco
    const savedToken = await RefreshToken.findOne({
      where: { token, isRevoked: false },
      include: [{ model: User, as: 'user' }],
    });

    if (!savedToken) {
      throw new AppError('Refresh token inválido', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Verificar se expirou
    if (new Date() > savedToken.expiresAt) {
      await savedToken.update({ isRevoked: true });
      throw new AppError('Refresh token expirado', 401, 'TOKEN_EXPIRED');
    }

    // Verificar JWT
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

    // Revogar token antigo
    await savedToken.update({ isRevoked: true });

    // Gerar novos tokens
    return this.generateTokens(user);
  }

  /**
   * Revoga todos os refresh tokens do usuário (logout de todos dispositivos)
   */
  async revokeAllTokens(userId: string): Promise<void> {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId, isRevoked: false } }
    );

    logger.info(`[AuthService] All tokens revoked for user: ${userId}`);
  }

  /**
   * Revoga um refresh token específico
   */
  async revokeToken(token: string): Promise<void> {
    const savedToken = await RefreshToken.findOne({ where: { token } });

    if (savedToken) {
      await savedToken.update({ isRevoked: true });
      logger.info(`[AuthService] Token revoked`);
    }
  }

  /**
   * Busca usuário pelo ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    // Se mudando email, verificar se já existe
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

  /**
   * Altera senha do usuário
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    // Verificar senha atual
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new AppError('Senha atual incorreta', 401, 'INVALID_PASSWORD');
    }

    // Atualizar senha
    await user.update({ password: newPassword });

    // Revogar todos tokens (forçar novo login)
    await this.revokeAllTokens(userId);

    logger.info(`[AuthService] Password changed for user: ${userId}`);
  }

  /**
   * Limpa refresh tokens expirados (para job de limpeza)
   */
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

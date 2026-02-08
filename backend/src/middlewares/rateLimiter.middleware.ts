import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';

interface RateLimitMessage {
  success: boolean;
  message: string;
  code: string;
}

export const createRateLimiter = (
  options: Partial<Options> = {}
): RateLimitRequestHandler => {
  const defaults: Partial<Options> = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Muitas requisições, tente novamente mais tarde',
      code: 'RATE_LIMIT_EXCEEDED',
    } as RateLimitMessage,
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({ ...defaults, ...options });
};

// General API rate limiter
export const apiLimiter = createRateLimiter();

// Stricter limiter for auth routes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Muitas tentativas de login, tente novamente em 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  } as RateLimitMessage,
});

// Strict limiter for password reset
export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    message: 'Muitas tentativas de reset de senha, tente novamente em 1 hora',
    code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
  } as RateLimitMessage,
});

export default {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
};

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
    windowMs: 15 * 60 * 1000,
    max: 100,
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


export const apiLimiter = createRateLimiter();


export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Muitas tentativas de login, tente novamente em 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  } as RateLimitMessage,
});


export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
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

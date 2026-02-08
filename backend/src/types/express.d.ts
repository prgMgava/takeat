import { UserAttributes } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: Omit<UserAttributes, 'password'>;
      userId?: string;
    }
  }
}

export {};

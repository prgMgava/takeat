import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

interface FormattedError {
  field: string | undefined;
  message: string;
  value: unknown;
}

export const validate = (validations: ValidationChain[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors: FormattedError[] = errors.array().map((err) => ({
      field: 'path' in err ? err.path : undefined,
      message: err.msg,
      value: 'value' in err ? err.value : undefined,
    }));

    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: formattedErrors,
    });
  };
};

export default { validate };

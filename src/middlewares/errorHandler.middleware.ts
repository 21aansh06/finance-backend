import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (config.NODE_ENV !== 'production') {
    console.error(err);
  }

  const isDev = config.NODE_ENV !== 'production';
  const response: any = { success: false };

  const attachStack = (errObj: any) => {
    if (isDev) response.stack = errObj.stack;
  };

  // 1. AppError
  if (err instanceof AppError) {
    response.message = err.message;
    attachStack(err);
    return res.status(err.statusCode).json(response);
  }

  // 2. ZodError
  if (err instanceof ZodError || err?.name === 'ZodError') {
    response.message = 'Validation failed';
    response.errors = err.flatten ? err.flatten().fieldErrors : err.errors;
    attachStack(err);
    return res.status(400).json(response);
  }

  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // 3. P2002
    if (err.code === 'P2002') {
      response.message = 'A record with this information already exists';
      attachStack(err);
      return res.status(409).json(response);
    }
    // 4. P2025
    if (err.code === 'P2025') {
      response.message = 'The requested resource was not found';
      attachStack(err);
      return res.status(404).json(response);
    }
    // 5. P2003
    if (err.code === 'P2003') {
      response.message = 'Invalid reference: related record does not exist';
      attachStack(err);
      return res.status(400).json(response);
    }
  }

  // 6. Prisma.PrismaClientValidationError
  if (err instanceof Prisma.PrismaClientValidationError) {
    response.message = 'Invalid data provided';
    attachStack(err);
    return res.status(400).json(response);
  }

  // 7. TokenExpiredError
  if (err instanceof TokenExpiredError || err?.name === 'TokenExpiredError') {
    response.message = 'Your session has expired, please login again';
    attachStack(err);
    return res.status(401).json(response);
  }

  // 8. JsonWebTokenError
  if (err instanceof JsonWebTokenError || err?.name === 'JsonWebTokenError') {
    response.message = 'Invalid authentication token';
    attachStack(err);
    return res.status(401).json(response);
  }

  // 9. SyntaxError
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    response.message = 'Invalid JSON in request body';
    attachStack(err);
    return res.status(400).json(response);
  }

  // 10. Fallback
  response.message = isDev ? err.message : 'Something went wrong';
  attachStack(err);
  return res.status(500).json(response);
};

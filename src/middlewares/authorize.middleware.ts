import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/errors';

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    
    if (!allowedRoles.includes(req.user.role as Role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    
    next();
  };
};

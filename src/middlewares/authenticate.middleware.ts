import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response';
import { config } from '../config/env';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return errorResponse(res, 'No token provided', 401);
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired', 401);
      }
      return errorResponse(res, 'Invalid token', 401);
    }

    req.user = decoded as Express.Request['user'];
    next();
  });
};

import { Request, Response, NextFunction } from 'express';
import * as summaryService from '../services/summary.service';
import { successResponse } from '../utils/response';
import { RecordType } from '@prisma/client';

export const summary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await summaryService.getDashboardSummary();
    return successResponse(res, data, 'Dashboard summary retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const categoryBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as RecordType | undefined;
    const data = await summaryService.getCategoryBreakdown(type);
    return successResponse(res, data, 'Category breakdown retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const monthlyTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 6;
    const data = await summaryService.getMonthlyTrends(months);
    return successResponse(res, data, 'Monthly trends retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const recentActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await summaryService.getRecentActivity(limit);
    return successResponse(res, data, 'Recent activity retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

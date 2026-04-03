import { Request, Response, NextFunction } from 'express';
import * as recordService from '../services/record.service';
import { successResponse, errorResponse } from '../utils/response';
import { querySchema } from '../validators/record.validator';
import { ZodError } from 'zod';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const record = await recordService.createRecord({ ...req.body, createdBy: userId });
    return successResponse(res, record, 'Record created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = querySchema.parse(req.query);
    const result = await recordService.getRecords(filters);
    
    return successResponse(res, {
      records: result.records,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }
    }, 'Records retrieved successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, error.flatten().fieldErrors);
    }
    next(error);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    return successResponse(res, record, 'Record retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body, req.user!.userId);
    return successResponse(res, record, 'Record updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await recordService.softDeleteRecord(req.params.id, req.user!.userId);
    return successResponse(res, result, 'Record deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

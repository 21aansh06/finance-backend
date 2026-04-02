import { Response } from 'express';

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
}

export const successResponse = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  const response: ApiResponse = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, message: string, statusCode = 400, errors?: any) => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};

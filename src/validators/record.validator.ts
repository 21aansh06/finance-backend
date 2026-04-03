import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(999999999.99),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1).max(100).trim(),
  date: z.string().datetime({ message: 'Date must be valid ISO 8601' }),
  notes: z.string().max(500).optional()
});

export const updateRecordSchema = createRecordSchema.partial();

export const querySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type QueryInput = z.infer<typeof querySchema>;

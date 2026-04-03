import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { Prisma, RecordType } from '@prisma/client';
import { CreateRecordInput, UpdateRecordInput, QueryInput } from '../validators/record.validator';
import { logAction } from './audit.service';

export const createRecord = async (data: CreateRecordInput & { createdBy: string }) => {
  if (data.amount > 999999999.99) throw new AppError('Amount exceeds maximum allowed value', 400);

  const record = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      type: data.type as RecordType,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes,
      createdBy: data.createdBy,
    },
  });

  await logAction({ 
    userId: data.createdBy, 
    action: 'RECORD_CREATED', 
    entity: 'FinancialRecord', 
    entityId: record.id, 
    metadata: { amount: data.amount, type: data.type, category: data.category } 
  });

  return record;
};

export const getRecords = async (filters: QueryInput) => {
  const { type, category, dateFrom, dateTo, page, limit, sortBy, sortOrder } = filters;

  if (page * limit > 10000) throw new AppError('Pagination offset too large', 400);

  const where: Prisma.FinancialRecordWhereInput = {
    isDeleted: false,
  };

  if (type) {
    where.type = type as RecordType;
  }

  if (category) {
    where.category = { contains: category, mode: 'insensitive' };
  }

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getRecordById = async (id: string) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!record) {
    throw new AppError('Record not found', 404);
  }

  return record;
};

export const updateRecord = async (id: string, data: UpdateRecordInput, userId: string) => {
  await getRecordById(id);

  const updateData: Prisma.FinancialRecordUpdateInput = {};
  
  if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
  if (data.type !== undefined) updateData.type = data.type as RecordType;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.notes !== undefined) updateData.notes = data.notes;

  const updated = await prisma.financialRecord.update({
    where: { id },
    data: updateData,
  });

  await logAction({
    userId,
    action: 'RECORD_UPDATED',
    entity: 'FinancialRecord',
    entityId: id,
    metadata: { updatedFields: Object.keys(data) }
  });

  return updated;
};

export const softDeleteRecord = async (id: string, deletedByUserId: string) => {
  await getRecordById(id);

  await prisma.financialRecord.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });

  await logAction({
    userId: deletedByUserId,
    action: 'RECORD_DELETED',
    entity: 'FinancialRecord',
    entityId: id,
  });

  return { message: 'Record deleted successfully' };
};

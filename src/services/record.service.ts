import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { Prisma, RecordType } from '@prisma/client';
import { CreateRecordInput, UpdateRecordInput, QueryInput } from '../validators/record.validator';

export const createRecord = async (data: CreateRecordInput & { createdBy: string }) => {
  return await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      type: data.type as RecordType,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes,
      createdBy: data.createdBy,
    },
  });
};

export const getRecords = async (filters: QueryInput) => {
  const { type, category, dateFrom, dateTo, page, limit, sortBy, sortOrder } = filters;

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

export const updateRecord = async (id: string, data: UpdateRecordInput) => {
  await getRecordById(id);

  const updateData: Prisma.FinancialRecordUpdateInput = {};
  
  if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
  if (data.type !== undefined) updateData.type = data.type as RecordType;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.notes !== undefined) updateData.notes = data.notes;

  return await prisma.financialRecord.update({
    where: { id },
    data: updateData,
  });
};

export const softDeleteRecord = async (id: string, deletedByUserId: string) => {
  await getRecordById(id);

  await prisma.financialRecord.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });

  return { message: 'Record deleted successfully' };
};

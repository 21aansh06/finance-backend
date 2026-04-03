import prisma from '../config/database';
import { Prisma, RecordType } from '@prisma/client';
import { AppError } from '../utils/errors';

export const getDashboardSummary = async () => {
  const [
    totalIncomeAgg,
    totalExpensesAgg,
    totalRecordsCount,
    incomeCount,
    expenseCount
  ] = await Promise.all([
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: { type: 'INCOME', isDeleted: false },
    }),
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: { type: 'EXPENSE', isDeleted: false },
    }),
    prisma.financialRecord.count({ where: { isDeleted: false } }),
    prisma.financialRecord.count({ where: { type: 'INCOME', isDeleted: false } }),
    prisma.financialRecord.count({ where: { type: 'EXPENSE', isDeleted: false } }),
  ]);

  const totalIncome = Number(totalIncomeAgg._sum.amount || 0);
  const totalExpenses = Number(totalExpensesAgg._sum.amount || 0);
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netBalance: Number(netBalance.toFixed(2)),
    totalRecords: totalRecordsCount,
    incomeCount,
    expenseCount,
  };
};

export const getCategoryBreakdown = async (type?: RecordType) => {
  const where: Prisma.FinancialRecordWhereInput = { isDeleted: false };
  if (type) {
    where.type = type;
  }

  const groupByResult = await prisma.financialRecord.groupBy({
    by: ['category'],
    _sum: { amount: true },
    _count: { _all: true },
    where,
  });

  const totalAmount = groupByResult.reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);

  const breakdown = groupByResult.map((item) => {
    const total = Number(item._sum.amount || 0);
    return {
      category: item.category,
      total: Number(total.toFixed(2)),
      count: item._count._all,
      percentage: totalAmount > 0 ? Number(((total / totalAmount) * 100).toFixed(2)) : 0,
    };
  });

  return breakdown.sort((a, b) => b.total - a.total);
};

export const getMonthlyTrends = async (months: number = 6) => {
  if (months < 1 || months > 24) {
    throw new AppError('months must be between 1 and 24', 400);
  }

  const validMonths = Math.min(Math.max(months, 1), 24);
  
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - validMonths + 1, 1);

  const rawResults = await prisma.$queryRaw<
    { month: string; income: number; expenses: number; net: number }[]
  >`
    SELECT
      TO_CHAR(date, 'YYYY-MM') as month,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expenses,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as net
    FROM "FinancialRecord"
    WHERE "isDeleted" = false AND date >= ${startDate}
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month ASC
  `;

  const formattedResults = rawResults.map(r => ({
    month: r.month,
    income: Number(Number(r.income).toFixed(2)),
    expenses: Number(Number(r.expenses).toFixed(2)),
    net: Number(Number(r.net).toFixed(2))
  }));

  const resultDict = formattedResults.reduce((acc, curr) => {
    acc[curr.month] = curr;
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number; net: number }>);

  const finalResults = [];
  for (let i = validMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const yyyyMm = `${d.getFullYear()}-${m}`;
    
    if (resultDict[yyyyMm]) {
      finalResults.push(resultDict[yyyyMm]);
    } else {
      finalResults.push({ month: yyyyMm, income: 0, expenses: 0, net: 0 });
    }
  }

  return finalResults;
};

export const getRecentActivity = async (limit: number = 10) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return records.map(r => ({
    id: r.id,
    amount: Number(Number(r.amount).toFixed(2)),
    type: r.type,
    category: r.category,
    date: r.date,
    displayAmount: `${r.type === 'INCOME' ? '+' : '-'}${Number(r.amount).toFixed(2)}`,
    user: r.user,
  }));
};

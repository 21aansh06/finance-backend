import prisma from '../config/database';

export const logAction = async (data: { userId: string, action: string, entity: string, entityId: string, metadata?: object }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata ? (data.metadata as any) : undefined,
      }
    });
  } catch (error) {
    console.error('Audit Log failed:', error);
  }
};

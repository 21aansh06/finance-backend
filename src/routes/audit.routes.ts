/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log viewing endpoints
 */

import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares';
import { PERMISSIONS } from '../constants/permissions';
import prisma from '../config/database';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
router.get('/', authorizeRoles(...PERMISSIONS.VIEW_AUDIT_LOG), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      }),
      prisma.auditLog.count()
    ]);

    return successResponse(res, {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch(error) {
    next(error);
  }
});

export default router;

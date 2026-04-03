/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Summaries and trends
 */

import { Router } from 'express';
import { summary, categoryBreakdown, monthlyTrends, recentActivity } from '../controllers/summary.controller';
import { authenticateToken, authorizeRoles } from '../middlewares';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Dashboard summary
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/summary', authorizeRoles(...PERMISSIONS.VIEW_DASHBOARD_SUMMARY), summary);

/**
 * @swagger
 * /dashboard/categories:
 *   get:
 *     summary: Category breakdown
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/categories', authorizeRoles(...PERMISSIONS.VIEW_ANALYTICS), categoryBreakdown);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Monthly trends
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/trends', authorizeRoles(...PERMISSIONS.VIEW_ANALYTICS), monthlyTrends);

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Recent activity feed
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/recent-activity', authorizeRoles(...PERMISSIONS.VIEW_RECENT_ACTIVITY), recentActivity);

export default router;

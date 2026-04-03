import { Router } from 'express';
import authRoutes from './auth.routes';
import recordRoutes from './record.routes';
import summaryRoutes from './summary.routes';
import auditRoutes from './audit.routes';
import { authenticateToken, authorizeRoles } from '../middlewares';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();


// APIs
router.use('/api/auth', authRoutes);
router.use('/api/records', recordRoutes);
router.use('/api/dashboard', summaryRoutes);
router.use('/api/audit', auditRoutes);

export default router;

import { Router } from 'express';
import authRoutes from './auth.routes';
import recordRoutes from './record.routes';
import summaryRoutes from './summary.routes';
import auditRoutes from './audit.routes';
import { authenticateToken, authorizeRoles } from '../middlewares';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();



router.get('/api/test/admin-only', authenticateToken, authorizeRoles(...PERMISSIONS.MANAGE_USERS), (req, res) => {
  res.status(200).json({ success: true, message: 'Access granted', role: req.user?.role });
});

router.get('/api/test/analyst-only', authenticateToken, authorizeRoles(...PERMISSIONS.VIEW_ANALYTICS), (req, res) => {
  res.status(200).json({ success: true, message: 'Access granted', role: req.user?.role });
});

router.get('/api/test/all-roles', authenticateToken, authorizeRoles(...PERMISSIONS.READ_RECORDS), (req, res) => {
  res.status(200).json({ success: true, message: 'Access granted', role: req.user?.role });
});

// Mounted sub-routers
router.use('/api/auth', authRoutes);
router.use('/api/records', recordRoutes);
router.use('/api/dashboard', summaryRoutes);
router.use('/api/audit', auditRoutes);

export default router;

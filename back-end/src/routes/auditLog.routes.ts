import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { getAuditLogs, getAuditLogFilters } from '../controllers/auditLog.controller';

const router = Router();

router.use(authenticate);

// Admin-only: paginated audit log with filters
router.get('/', requireRole('admin'), getAuditLogs);

// Admin-only: filter options for the admin UI
router.get('/filters', requireRole('admin'), getAuditLogFilters);

export default router;

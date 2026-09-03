import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { createObservation, deleteObservation, getObservationById, getObservations } from '../controllers/observation.controller';

const router = Router();
router.use(authenticate);
router.get('/', requireRole('admin', 'teacher', 'student'), getObservations);
router.get('/:id', requireRole('admin', 'teacher', 'student'), getObservationById);
router.post('/', requireRole('admin', 'teacher'), createObservation);
router.delete('/:id', requireRole('admin', 'teacher'), deleteObservation);
export default router;
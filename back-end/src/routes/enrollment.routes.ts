import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment, getEnrollmentsByCourse,
} from '../controllers/enrollment.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin'), getEnrollments);
router.post('/', requireRole('admin', 'teacher'), createEnrollment);
router.get('/course/:courseId', requireRole('admin', 'teacher'), getEnrollmentsByCourse);
router.put('/:id', requireRole('admin'), updateEnrollment);
router.delete('/:id', requireRole('admin'), deleteEnrollment);

export default router;

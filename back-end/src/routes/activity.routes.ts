import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  getActivitySubmissions,
} from '../controllers/activity.controller';

const router = Router();

router.use(authenticate);

// Activities list and detail – teacher/student/admin (scope enforced in controller)
router.get('/', requireRole('admin', 'teacher', 'student', 'parent'), getActivities);
router.get('/:id', requireRole('admin', 'teacher', 'student', 'parent'), getActivityById);

// Teacher creates / updates activities in their own courses only
router.post('/', requireRole('admin', 'teacher'), createActivity);
router.put('/:id', requireRole('admin', 'teacher'), updateActivity);

// Submissions for an activity (teacher sees all; student sees own)
router.get('/:id/submissions', requireRole('admin', 'teacher', 'student'), getActivitySubmissions);

export default router;

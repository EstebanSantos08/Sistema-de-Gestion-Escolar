import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { getTeachers, getTeacherById, getMyCourses } from '../controllers/teacher.controller';
import { getTeacherDailySummary } from '../controllers/dailySummary.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin'), getTeachers);
router.get('/me/courses', requireRole('teacher'), getMyCourses);
// Teacher daily summary – scoped to authenticated teacher's own courses
router.get('/me/daily-summary', requireRole('teacher'), getTeacherDailySummary);
router.get('/:id', requireRole('admin'), getTeacherById);

export default router;

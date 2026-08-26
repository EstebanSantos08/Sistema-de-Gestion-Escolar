import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/course.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), getCourses);
router.post('/', requireRole('admin'), createCourse);
router.get('/:id', requireRole('admin', 'teacher'), getCourseById);
router.put('/:id', requireRole('admin'), updateCourse);
router.delete('/:id', requireRole('admin'), deleteCourse);

export default router;

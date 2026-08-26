import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { getStudents, getStudentById, getStudentGrades, getMyGrades } from '../controllers/student.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), getStudents);
router.get('/me/grades', requireRole('student'), getMyGrades);
router.get('/:id', requireRole('admin', 'teacher', 'student'), getStudentById);
router.get('/:id/grades', requireRole('admin', 'teacher', 'student'), getStudentGrades);

export default router;

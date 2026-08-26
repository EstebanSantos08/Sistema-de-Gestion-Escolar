import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  getGradesByCourse, createGrade, createGradeBatch, updateGrade, deleteGrade,
} from '../controllers/grade.controller';

const router = Router();

router.use(authenticate);

router.get('/course/:courseId', requireRole('admin', 'teacher'), getGradesByCourse);
router.post('/', requireRole('admin', 'teacher'), createGrade);
router.post('/batch', requireRole('admin', 'teacher'), createGradeBatch);
router.put('/:id', requireRole('admin', 'teacher'), updateGrade);
router.delete('/:id', requireRole('admin'), deleteGrade);

export default router;

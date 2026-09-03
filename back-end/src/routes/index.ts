import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import studentRoutes from './student.routes';
import teacherRoutes from './teacher.routes';
import courseRoutes from './course.routes';
import enrollmentRoutes from './enrollment.routes';
import gradeRoutes from './grade.routes';
import reportRoutes from './report.routes';
import observationRoutes from './observation.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/grades', gradeRoutes);
router.use('/reports', reportRoutes);
router.use('/observations', observationRoutes);

export default router;

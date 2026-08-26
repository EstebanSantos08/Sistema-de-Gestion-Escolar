import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { excelCourse, excelStudent, excelAllGrades, pdfStudent, pdfCourse, pdfTranscript } from '../controllers/report.controller';

const router = Router();

router.use(authenticate);

// Excel
router.get('/excel/course/:courseId', requireRole('admin', 'teacher'), excelCourse);
router.get('/excel/student/:studentId', requireRole('admin', 'teacher', 'student'), excelStudent);
router.get('/excel/all-grades', requireRole('admin'), excelAllGrades);

// PDF
router.get('/pdf/student/:studentId', requireRole('admin', 'teacher', 'student'), pdfStudent);
router.get('/pdf/course/:courseId', requireRole('admin', 'teacher'), pdfCourse);
router.get('/pdf/transcript/:studentId', requireRole('admin', 'student'), pdfTranscript);

export default router;

import { Router } from 'express';
import { getAttendance, saveAttendanceBatch } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAttendance);
router.put('/batch', saveAttendanceBatch);

export default router;

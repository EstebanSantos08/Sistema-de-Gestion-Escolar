import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  gradeSubmission,
  uploadEvidenceFile,
  downloadEvidence,
  replaceEvidenceFile,
} from '../controllers/submission.controller';

const router = Router();

router.use(authenticate);

// Student creates submission for an activity
router.post('/', requireRole('student'), createSubmission);

// Get submission detail (teacher sees course-scoped; student sees own)
router.get('/:id', requireRole('admin', 'teacher', 'student'), getSubmissionById);

// Student updates own submission notes
router.put('/:id', requireRole('student'), updateSubmission);

// Teacher grades a submission (task grade: score + feedback on Submission)
router.post('/:id/grade', requireRole('admin', 'teacher'), gradeSubmission);

// Evidence upload (multipart replaced by base64 for simplicity; enforced MIME)
router.post('/:id/evidence', requireRole('student', 'teacher'), uploadEvidenceFile);

// Evidence download (short-lived signed URL, redirected)
router.get('/:id/evidence/:evidenceId/download', requireRole('admin', 'teacher', 'student'), downloadEvidence);

// Evidence replacement
router.put('/:id/evidence/:evidenceId', requireRole('student'), replaceEvidenceFile);

export default router;

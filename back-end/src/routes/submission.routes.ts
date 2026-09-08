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
import {
  evidenceUploadMiddleware,
  authorizeEvidenceUpload,
  authorizeEvidenceReplace,
} from '../middlewares/upload.middleware';

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

// Evidence upload (multipart/form-data with "file" and optional "caption")
router.post(
  '/:id/evidence',
  requireRole('student', 'teacher'),
  authorizeEvidenceUpload,
  evidenceUploadMiddleware,
  uploadEvidenceFile
);

// Evidence download (short-lived signed URL, redirected)
router.get('/:id/evidence/:evidenceId/download', requireRole('admin', 'teacher', 'student'), downloadEvidence);

// Evidence replacement (multipart/form-data with "file" and optional "caption")
router.put(
  '/:id/evidence/:evidenceId',
  requireRole('student'),
  authorizeEvidenceReplace,
  evidenceUploadMiddleware,
  replaceEvidenceFile
);

export default router;

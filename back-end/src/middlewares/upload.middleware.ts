import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { MAX_FILE_BYTES } from '../services/storage.service';
import { Submission, Activity } from '../models/index';
import {
  getStudentProfile,
  getTeacherProfile,
  requireTeacherOwnsCourse,
  requireStudentEnrolled,
} from '../services/scope.service';

// Memory-only storage — NEVER write temporary uploads to repository or local disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_BYTES, // 1,048,576 bytes (1 MiB)
    files: 1,
  },
});

/**
 * Middleware: parse single file upload under field name "file".
 * Enforces memory-only reception and maximum 1,048,576 bytes limit.
 */
export const evidenceUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(422).json({
          success: false,
          error: `El archivo supera el tamaño máximo de ${MAX_FILE_BYTES} bytes`,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: `Error en la subida del archivo: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        error: `Error al procesar archivo: ${err.message}`,
      });
      return;
    }
    next();
  });
};

/**
 * Middleware: authorize submission ownership BEFORE multipart parsing on POST /api/submissions/:id/evidence
 * Prevents unauthorized users from streaming or buffering files.
 */
export const authorizeEvidenceUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const submissionId = Number(req.params.id);
    if (!submissionId || isNaN(submissionId)) {
      res.status(400).json({ success: false, error: 'ID de entrega inválido' });
      return;
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      res.status(404).json({ success: false, error: 'Entrega no encontrada' });
      return;
    }

    const role = req.user?.role;
    if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student || student.id !== submission.studentId) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    } else if (role === 'teacher') {
      const teacher = await getTeacherProfile(req.user!.id);
      if (!teacher) {
        res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' });
        return;
      }
      const activity = await Activity.findByPk(submission.activityId);
      if (!activity) {
        res.status(404).json({ success: false, error: 'Actividad no encontrada' });
        return;
      }
      const course = await requireTeacherOwnsCourse(teacher.id, activity.courseId);
      if (!course) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const activity = await Activity.findByPk(submission.activityId);
    if (!activity) {
      res.status(404).json({ success: false, error: 'Actividad no encontrada' });
      return;
    }

    const enrollment = await requireStudentEnrolled(submission.studentId, activity.courseId);
    if (!enrollment) {
      res.status(403).json({
        success: false,
        error: 'Estudiante no matriculado en el curso de esta actividad',
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({ success: false, error: 'Error de autorización de entrega' });
  }
};

/**
 * Middleware: authorize evidence replacement BEFORE multipart parsing on PUT /api/submissions/:id/evidence/:evidenceId
 */
export const authorizeEvidenceReplace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const submissionId = Number(req.params.id);
    const evidenceId = Number(req.params.evidenceId);

    if (!submissionId || isNaN(submissionId) || !evidenceId || isNaN(evidenceId)) {
      res.status(400).json({ success: false, error: 'Parámetros inválidos' });
      return;
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      res.status(404).json({ success: false, error: 'Entrega no encontrada' });
      return;
    }

    const student = await getStudentProfile(req.user!.id);
    if (!student || student.id !== submission.studentId) {
      res.status(403).json({ success: false, error: 'Acceso denegado' });
      return;
    }

    next();
  } catch {
    res.status(500).json({ success: false, error: 'Error de autorización de evidencia' });
  }
};

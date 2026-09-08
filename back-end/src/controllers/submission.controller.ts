import { Request, Response } from 'express';
import sequelize from '../config/database';
import { Submission, Activity, Student, User, Evidence, Course } from '../models/index';
import {
  getTeacherProfile,
  requireTeacherOwnsCourse,
  getStudentProfile,
  requireStudentEnrolled,
  requireTeacherCanGradeSubmission,
  requireStudentOwnsSubmission,
} from '../services/scope.service';
import { createAuditLog, extractIp } from '../services/auditLog.service';
import {
  validateMimeType,
  uploadEvidence,
  generateSignedUrl,
  deleteStorageObject,
  buildObjectKey,
} from '../services/storage.service';

const GRADE_MIN = Number(process.env.GRADE_MIN ?? 0);
const GRADE_MAX = Number(process.env.GRADE_MAX ?? 10);

// ── POST /api/submissions — student creates submission ────────────────────────

export const createSubmission = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const student = await getStudentProfile(req.user!.id);
    if (!student) {
      await tx.rollback();
      res.status(403).json({ success: false, error: 'Perfil de estudiante no encontrado' });
      return;
    }

    const { activityId, studentNotes } = req.body as {
      activityId: number;
      studentNotes?: string;
    };

    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      await tx.rollback();
      res.status(404).json({ success: false, error: 'Actividad no encontrada' });
      return;
    }

    const enrollment = await requireStudentEnrolled(student.id, activity.courseId);
    if (!enrollment) {
      await tx.rollback();
      res.status(403).json({ success: false, error: 'No estás matriculado en este curso' });
      return;
    }

    // Enforce one submission per student per activity
    const existing = await Submission.findOne({
      where: { activityId, studentId: student.id },
      transaction: tx,
    });
    if (existing) {
      await tx.rollback();
      res.status(409).json({
        success: false,
        error: 'Ya existe una entrega para esta actividad. Usa PUT para reemplazarla.',
      });
      return;
    }

    const submission = await Submission.create(
      {
        activityId: Number(activityId),
        studentId: student.id,
        representativeId: null, // student submits directly – no representative fallback
        status: 'entregada',
        submittedAt: new Date(),
        studentNotes: studentNotes ?? null,
        teacherFeedback: null,
        score: null,
      },
      { transaction: tx }
    );

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'SUBMISSION_CREATED',
      resource: 'submissions',
      resourceId: submission.id,
      details: {
        actorRole: req.user!.role,
        studentId: student.id,
        activityId: activity.id,
        activityTitle: activity.title,
        courseId: activity.courseId,
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.status(201).json({ success: true, data: submission, message: 'Entrega registrada' });
  } catch {
    await tx.rollback();
    res.status(500).json({ success: false, error: 'Error al registrar entrega' });
  }
};

// ── GET /api/submissions/:id — student sees own; teacher sees theirs ──────────

export const getSubmissionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const submission = await Submission.findByPk(req.params.id, {
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        { model: Evidence, as: 'evidences', attributes: ['id', 'type', 'fileName', 'caption', 'storageObjectKey', 'createdAt'] },
        { model: Activity, as: 'activity', attributes: ['id', 'title', 'courseId', 'maxScore', 'dueDate'] },
      ],
    });
    if (!submission) {
      res.status(404).json({ success: false, error: 'Entrega no encontrada' });
      return;
    }

    const role = req.user!.role;

    if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student || student.id !== submission.studentId) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    } else if (role === 'teacher') {
      const teacher = await getTeacherProfile(req.user!.id);
      if (!teacher) { res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' }); return; }
      const activity = await Activity.findByPk(submission.activityId);
      if (!activity) { res.status(404).json({ success: false, error: 'Actividad no encontrada' }); return; }
      const course = await requireTeacherOwnsCourse(teacher.id, activity.courseId);
      if (!course) { res.status(403).json({ success: false, error: 'Acceso denegado' }); return; }
    }
    // admin: unrestricted

    // Strip storageObjectKey from response – never expose to client
    const data = submission.toJSON() as Record<string, unknown>;
    const evidences = (data.evidences as Array<Record<string, unknown>> | undefined) ?? [];
    data.evidences = evidences.map(({ storageObjectKey: _sk, ...rest }) => rest);

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── PUT /api/submissions/:id — student replaces own notes ────────────────────

export const updateSubmission = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const student = await getStudentProfile(req.user!.id);
    if (!student) { await tx.rollback(); res.status(403).json({ success: false, error: 'Perfil de estudiante no encontrado' }); return; }

    const submission = await requireStudentOwnsSubmission(student.id, Number(req.params.id));
    if (!submission) { await tx.rollback(); res.status(403).json({ success: false, error: 'Acceso denegado o entrega no encontrada' }); return; }

    const { studentNotes } = req.body as { studentNotes?: string };
    const old = { studentNotes: submission.studentNotes, status: submission.status };

    if (studentNotes !== undefined) submission.studentNotes = studentNotes;
    submission.status = 'en_proceso';
    await submission.save({ transaction: tx });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'SUBMISSION_REPLACED',
      resource: 'submissions',
      resourceId: submission.id,
      details: {
        actorRole: req.user!.role,
        studentId: student.id,
        activityId: submission.activityId,
        oldValues: old,
        newValues: { studentNotes, status: submission.status },
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.json({ success: true, data: submission, message: 'Entrega actualizada' });
  } catch {
    await tx.rollback();
    res.status(500).json({ success: false, error: 'Error al actualizar entrega' });
  }
};

// ── POST /api/submissions/:id/grade — teacher grades a submission ─────────────

export const gradeSubmission = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const submissionId = Number(req.params.id);
    let submission: Submission | null = null;

    if (req.user!.role === 'teacher') {
      const teacher = await getTeacherProfile(req.user!.id);
      if (!teacher) { await tx.rollback(); res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' }); return; }
      submission = await requireTeacherCanGradeSubmission(teacher.id, submissionId);
      if (!submission) {
        await tx.rollback();
        res.status(403).json({ success: false, error: 'No tienes permiso para calificar esta entrega' });
        return;
      }
    } else {
      // admin
      submission = await Submission.findByPk(submissionId, { transaction: tx });
      if (!submission) {
        await tx.rollback();
        res.status(404).json({ success: false, error: 'Entrega no encontrada' });
        return;
      }
    }

    const { score, teacherFeedback } = req.body as { score?: number; teacherFeedback?: string };

    if (score !== undefined && (score < GRADE_MIN || score > GRADE_MAX)) {
      await tx.rollback();
      res.status(422).json({ success: false, error: `La nota debe estar entre ${GRADE_MIN} y ${GRADE_MAX}` });
      return;
    }

    const isFirstGrade = submission.score === null;
    const old = { score: submission.score, teacherFeedback: submission.teacherFeedback, status: submission.status };

    if (score !== undefined) submission.score = score;
    if (teacherFeedback !== undefined) submission.teacherFeedback = teacherFeedback;
    submission.status = 'completada';
    await submission.save({ transaction: tx });

    const activity = await Activity.findByPk(submission.activityId);
    await createAuditLog({
      actorUserId: req.user!.id,
      action: isFirstGrade ? 'TASK_GRADE_CREATED' : 'TASK_GRADE_UPDATED',
      resource: 'submissions',
      resourceId: submission.id,
      details: {
        actorRole: req.user!.role,
        gradeCategory: 'task',
        studentId: submission.studentId,
        activityId: submission.activityId,
        activityTitle: activity?.title,
        courseId: activity?.courseId,
        oldValues: isFirstGrade ? undefined : old,
        newValues: { score, teacherFeedback },
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.json({ success: true, data: submission, message: isFirstGrade ? 'Calificación registrada' : 'Calificación actualizada' });
  } catch {
    await tx.rollback();
    res.status(500).json({ success: false, error: 'Error al calificar entrega' });
  }
};

// ── POST /api/submissions/:id/evidence — upload evidence file (multipart/form-data) ──

export const uploadEvidenceFile = async (req: Request, res: Response): Promise<void> => {
  let uploadSucceeded = false;
  let objectKey: string | null = null;

  try {
    // 1. Check multipart file presence (memory storage)
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, error: 'El archivo es requerido (campo "file")' });
      return;
    }

    const buffer = req.file.buffer;
    const originalFileName = req.file.originalname || 'archivo';
    const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : null;

    // 2. Validate size and content via magic bytes (never trust client extension/mime)
    const validation = validateMimeType(buffer);
    if (!validation.valid) {
      res.status(422).json({ success: false, error: validation.error });
      return;
    }

    const submission = await Submission.findByPk(req.params.id);
    if (!submission) {
      res.status(404).json({ success: false, error: 'Entrega no encontrada' });
      return;
    }

    // Authorization: student must own it OR teacher must own the course
    const role = req.user?.role;
    if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student || student.id !== submission.studentId) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    } else if (role === 'teacher') {
      const teacher = await getTeacherProfile(req.user!.id);
      if (!teacher) { res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' }); return; }
      const activity = await Activity.findByPk(submission.activityId);
      if (!activity) { res.status(404).json({ success: false, error: 'Actividad no encontrada' }); return; }
      const course = await requireTeacherOwnsCourse(teacher.id, activity.courseId);
      if (!course) { res.status(403).json({ success: false, error: 'Acceso denegado' }); return; }
    }

    const activity = await Activity.findByPk(submission.activityId);
    if (!activity) { res.status(404).json({ success: false, error: 'Actividad no encontrada' }); return; }

    // Verify course/activity/student relationship before upload
    const enrollment = await requireStudentEnrolled(submission.studentId, activity.courseId);
    if (!enrollment) {
      res.status(403).json({ success: false, error: 'Estudiante no matriculado en el curso de esta actividad' });
      return;
    }

    // 3. Server generates Storage object key (extension derived from verified MIME)
    objectKey = buildObjectKey({
      courseId: activity.courseId,
      activityId: activity.id,
      studentId: submission.studentId,
      mimeType: validation.detectedMime!,
    });

    // 4. Upload buffer to Storage (prior to DB transaction)
    await uploadEvidence(buffer, validation.detectedMime!, objectKey);
    uploadSucceeded = true;

    // 5. PostgreSQL transaction for Evidence metadata + AuditLog
    const tx = await sequelize.transaction();
    try {
      const evidenceType: 'imagen' | 'documento' =
        validation.detectedMime === 'application/pdf' ? 'documento' : 'imagen';

      const safeFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);

      const evidence = await Evidence.create(
        {
          submissionId: submission.id,
          type: evidenceType,
          storageObjectKey: objectKey,
          fileUrl: objectKey, // backward compat column
          fileName: safeFileName,
          mimeType: validation.detectedMime!,
          fileSize: buffer.length,
          caption: caption || null,
        },
        { transaction: tx }
      );

      await createAuditLog({
        actorUserId: req.user!.id,
        action: 'EVIDENCE_CREATED',
        resource: 'evidences',
        resourceId: evidence.id,
        details: {
          actorRole: req.user!.role,
          studentId: submission.studentId,
          activityId: activity.id,
          courseId: activity.courseId,
          mimeType: validation.detectedMime,
          fileSize: buffer.length,
        },
        ipAddress: extractIp(req),
        transaction: tx,
      });

      await tx.commit();

      // Return evidence metadata without the storage object key
      const { storageObjectKey: _sk, fileUrl: _fu, ...safeEvidence } = evidence.toJSON() as Record<string, unknown>;
      res.status(201).json({ success: true, data: safeEvidence, message: 'Evidencia subida correctamente' });
    } catch (dbErr) {
      await tx.rollback();
      throw dbErr;
    }
  } catch (err) {
    // If upload succeeded but DB failed → compensation: delete newly uploaded object
    if (uploadSucceeded && objectKey) {
      console.error(
        `[STORAGE_COMPENSATION] Upload succeeded but DB failed for key "${objectKey}". Compensating delete.`
      );
      try {
        await deleteStorageObject(objectKey);
      } catch (compErr) {
        console.error('[STORAGE_COMPENSATION] Failed to delete orphaned object:', compErr);
      }
    }

    console.error(err);
    res.status(500).json({ success: false, error: 'Error al subir evidencia' });
  }
};

// ── GET /api/submissions/:submissionId/evidence/:evidenceId/download ──────────

export const downloadEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const evidence = await Evidence.findOne({
      where: { id: req.params.evidenceId, submissionId: req.params.id },
    });
    if (!evidence) {
      res.status(404).json({ success: false, error: 'Evidencia no encontrada' });
      return;
    }

    const submission = await Submission.findByPk(evidence.submissionId);
    if (!submission) { res.status(404).json({ success: false, error: 'Entrega no encontrada' }); return; }

    // Authorization
    const role = req.user!.role;
    if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student || student.id !== submission.studentId) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    } else if (role === 'teacher') {
      const teacher = await getTeacherProfile(req.user!.id);
      if (!teacher) { res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' }); return; }
      const activity = await Activity.findByPk(submission.activityId);
      if (!activity) { res.status(404).json({ success: false, error: 'Actividad no encontrada' }); return; }
      const course = await requireTeacherOwnsCourse(teacher.id, activity.courseId);
      if (!course) { res.status(403).json({ success: false, error: 'Acceso denegado' }); return; }
    }

    const objectKey = evidence.storageObjectKey;
    const signedUrl = await generateSignedUrl(objectKey);

    // Redirect to signed URL – never persist this URL
    res.redirect(302, signedUrl);
  } catch {
    res.status(500).json({ success: false, error: 'Error al descargar evidencia' });
  }
};

// ── PUT /api/submissions/:id/evidence/:evidenceId — replace evidence (multipart/form-data) ──

export const replaceEvidenceFile = async (req: Request, res: Response): Promise<void> => {
  let oldObjectKey: string | null = null;
  let newObjectKey: string | null = null;
  let uploadSucceeded = false;

  try {
    // 1. Check multipart file presence (memory storage)
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, error: 'El archivo es requerido (campo "file")' });
      return;
    }

    const buffer = req.file.buffer;
    const originalFileName = req.file.originalname || 'archivo';
    const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : undefined;

    // 2. Validate size and content via magic bytes (never trust client extension/mime)
    const validation = validateMimeType(buffer);
    if (!validation.valid) {
      res.status(422).json({ success: false, error: validation.error });
      return;
    }

    const evidence = await Evidence.findOne({
      where: { id: req.params.evidenceId, submissionId: req.params.id },
    });
    if (!evidence) {
      res.status(404).json({ success: false, error: 'Evidencia no encontrada' });
      return;
    }

    const submission = await Submission.findByPk(evidence.submissionId);
    if (!submission) {
      res.status(404).json({ success: false, error: 'Entrega no encontrada' });
      return;
    }

    // Authorization: student must own it
    const student = await getStudentProfile(req.user!.id);
    if (!student || student.id !== submission.studentId) {
      res.status(403).json({ success: false, error: 'Acceso denegado' });
      return;
    }

    const activity = await Activity.findByPk(submission.activityId);
    if (!activity) {
      res.status(404).json({ success: false, error: 'Actividad no encontrada' });
      return;
    }

    oldObjectKey = evidence.storageObjectKey;

    newObjectKey = buildObjectKey({
      courseId: activity.courseId,
      activityId: activity.id,
      studentId: submission.studentId,
      evidenceId: evidence.id,
      mimeType: validation.detectedMime!,
    });

    // 3. Upload new object to Storage
    await uploadEvidence(buffer, validation.detectedMime!, newObjectKey);
    uploadSucceeded = true;

    // 4. Update in PostgreSQL with transaction
    const tx = await sequelize.transaction();
    try {
      const evidenceType: 'imagen' | 'documento' =
        validation.detectedMime === 'application/pdf' ? 'documento' : 'imagen';
      const safeFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);

      await evidence.update(
        {
          storageObjectKey: newObjectKey,
          fileUrl: newObjectKey,
          fileName: safeFileName,
          mimeType: validation.detectedMime!,
          fileSize: buffer.length,
          type: evidenceType,
          caption: caption !== undefined ? (caption || null) : evidence.caption,
        },
        { transaction: tx }
      );

      await createAuditLog({
        actorUserId: req.user!.id,
        action: 'EVIDENCE_REPLACED',
        resource: 'evidences',
        resourceId: evidence.id,
        details: {
          actorRole: req.user!.role,
          studentId: submission.studentId,
          activityId: activity.id,
          courseId: activity.courseId,
          newMimeType: validation.detectedMime,
          newFileSize: buffer.length,
        },
        ipAddress: extractIp(req),
        transaction: tx,
      });

      // 5. Commit — old object preserved until here
      await tx.commit();

      // 6. Remove old object ONLY after DB success
      if (oldObjectKey) {
        try {
          await deleteStorageObject(oldObjectKey);
        } catch (delErr) {
          console.error('[STORAGE_OLD_OBJECT_DELETE_FAIL]', delErr);
        }
      }

      const { storageObjectKey: _sk, fileUrl: _fu, ...safeEvidence } = evidence.toJSON() as Record<string, unknown>;
      res.json({ success: true, data: safeEvidence, message: 'Evidencia reemplazada correctamente' });
    } catch (dbErr) {
      await tx.rollback();
      throw dbErr;
    }
  } catch (err) {
    // If upload succeeded but DB failed → compensation: delete newly uploaded object
    if (uploadSucceeded && newObjectKey) {
      console.error(
        `[STORAGE_COMPENSATION] Upload succeeded but DB failed for new key "${newObjectKey}". Compensating delete.`
      );
      try {
        await deleteStorageObject(newObjectKey);
      } catch (compErr) {
        console.error('[STORAGE_COMPENSATION] Failed to delete orphaned object:', compErr);
      }
    }

    console.error(err);
    res.status(500).json({ success: false, error: 'Error al reemplazar evidencia' });
  }
};

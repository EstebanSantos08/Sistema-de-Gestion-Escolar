import { Request, Response } from 'express';
import sequelize from '../config/database';
import { Grade, Enrollment, Course, Student, User, Teacher } from '../models/index';
import { calculateWeightedAverage, isPassed } from '../utils/grades';
import { createAuditLog, extractIp } from '../services/auditLog.service';

const GRADE_MIN = Number(process.env.GRADE_MIN ?? 0);
const GRADE_MAX = Number(process.env.GRADE_MAX ?? 10);

async function getTeacherForUser(userId: number): Promise<Teacher | null> {
  return Teacher.findOne({ where: { userId } });
}

async function verifyTeacherOwnsCourse(teacherId: number, courseId: number): Promise<boolean> {
  const course = await Course.findByPk(courseId);
  return course?.teacherId === teacherId;
}

// ── GET /api/grades/course/:courseId ─────────────────────────────────────────

export const getGradesByCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = Number(req.params.courseId);
    const { period } = req.query;

    if (req.user?.role === 'teacher') {
      const teacher = await getTeacherForUser(req.user.id);
      if (!teacher || !(await verifyTeacherOwnsCourse(teacher.id, courseId))) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const enrollmentWhere: Record<string, unknown> = { courseId };
    if (period) enrollmentWhere.period = period;

    const enrollments = await Enrollment.findAll({
      where: enrollmentWhere,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
        { model: Grade, as: 'grades' },
      ],
    });

    res.json({ success: true, data: enrollments });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── POST /api/grades — create academic grade ──────────────────────────────────

export const createGrade = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const { enrollmentId, gradeType, score, weight, comments } = req.body as {
      enrollmentId: number; gradeType: string; score: number; weight: number; comments: string;
    };

    if (score < GRADE_MIN || score > GRADE_MAX) {
      await tx.rollback();
      res.status(422).json({ success: false, error: `La nota debe estar entre ${GRADE_MIN} y ${GRADE_MAX}` });
      return;
    }
    if (weight < 0 || weight > 1) {
      await tx.rollback();
      res.status(422).json({ success: false, error: 'El peso debe estar entre 0 y 1' });
      return;
    }

    const enrollment = await Enrollment.findByPk(enrollmentId, {
      include: [{ model: Course, as: 'course' }],
      transaction: tx,
    });
    if (!enrollment) {
      await tx.rollback();
      res.status(404).json({ success: false, error: 'Matrícula no encontrada' });
      return;
    }

    if (req.user?.role === 'teacher') {
      const teacher = await getTeacherForUser(req.user.id);
      const courseId = (enrollment.course as Course)?.id ?? enrollment.courseId;
      if (!teacher || !(await verifyTeacherOwnsCourse(teacher.id, courseId))) {
        await tx.rollback();
        res.status(403).json({ success: false, error: 'No tienes permiso para calificar este curso' });
        return;
      }
    }

    const existing = await Grade.findOne({ where: { enrollmentId, gradeType }, transaction: tx });
    if (existing) {
      await tx.rollback();
      res.status(409).json({ success: false, error: 'Ya existe una nota de este tipo. Usa PUT para editar.' });
      return;
    }

    const grade = await Grade.create(
      {
        enrollmentId,
        gradeType,
        score,
        weight: weight ?? 1.0,
        comments: comments || '',
        gradedById: req.user!.id,
      },
      { transaction: tx }
    );

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ACADEMIC_GRADE_CREATED',
      resource: 'grades',
      resourceId: grade.id,
      details: {
        actorRole: req.user!.role,
        gradeCategory: 'academic',
        enrollmentId,
        gradeType,
        score,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.status(201).json({ success: true, data: grade, message: 'Calificación registrada' });
  } catch {
    await tx.rollback();
    res.status(500).json({ success: false, error: 'Error al registrar calificación' });
  }
};

// ── POST /api/grades/batch ────────────────────────────────────────────────────

export const createGradeBatch = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const { courseId, gradeType, weight, grades } = req.body as {
      courseId: number;
      gradeType: string;
      weight: number;
      grades: Array<{ enrollmentId: number; score: number; comments?: string }>;
    };

    if (req.user?.role === 'teacher') {
      const teacher = await getTeacherForUser(req.user.id);
      if (!teacher || !(await verifyTeacherOwnsCourse(teacher.id, courseId))) {
        await tx.rollback();
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const results: Grade[] = [];
    for (const g of grades) {
      if (g.score < GRADE_MIN || g.score > GRADE_MAX) {
        await tx.rollback();
        res.status(422).json({ success: false, error: `Nota inválida para matrícula ${g.enrollmentId}: debe estar entre ${GRADE_MIN} y ${GRADE_MAX}` });
        return;
      }
      const [grade] = await Grade.upsert(
        {
          enrollmentId: g.enrollmentId,
          gradeType,
          score: g.score,
          weight: weight ?? 1.0,
          comments: g.comments || '',
          gradedById: req.user!.id,
          gradedAt: new Date(),
        },
        { transaction: tx }
      );
      results.push(grade);
    }

    // Batch audit log (one entry per batch, not per grade)
    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ACADEMIC_GRADE_CREATED',
      resource: 'grades',
      details: {
        actorRole: req.user!.role,
        gradeCategory: 'academic',
        courseId,
        gradeType,
        batchSize: results.length,
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.json({ success: true, data: results, message: `${results.length} calificaciones guardadas` });
  } catch {
    await tx.rollback();
    res.status(500).json({ success: false, error: 'Error al guardar calificaciones' });
  }
};

// ── PUT /api/grades/:id ───────────────────────────────────────────────────────

export const updateGrade = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const grade = await Grade.findByPk(req.params.id, {
      include: [{ model: Enrollment, as: 'enrollment', include: [{ model: Course, as: 'course' }] }],
      transaction: tx,
    });
    if (!grade) {
      await tx.rollback();
      res.status(404).json({ success: false, error: 'Calificación no encontrada' });
      return;
    }

    if (req.user?.role === 'teacher') {
      const teacher = await getTeacherForUser(req.user.id);
      const courseId = ((grade.enrollment as Enrollment & { course?: Course })?.course as Course)?.id;
      if (!teacher || !courseId || !(await verifyTeacherOwnsCourse(teacher.id, courseId))) {
        await tx.rollback();
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const { score, comments } = req.body as { score?: number; comments?: string };
    const old = { score: grade.score, comments: grade.comments };

    if (score !== undefined) {
      if (score < GRADE_MIN || score > GRADE_MAX) {
        await tx.rollback();
        res.status(422).json({ success: false, error: `La nota debe estar entre ${GRADE_MIN} y ${GRADE_MAX}` });
        return;
      }
      grade.score = score;
    }
    if (comments !== undefined) grade.comments = comments;
    grade.gradedById = req.user!.id;
    grade.gradedAt = new Date();
    await grade.save({ transaction: tx });

    const enrollment = grade.enrollment as Enrollment | undefined;
    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ACADEMIC_GRADE_UPDATED',
      resource: 'grades',
      resourceId: grade.id,
      details: {
        actorRole: req.user!.role,
        gradeCategory: 'academic',
        gradeType: grade.gradeType,
        courseId: enrollment?.courseId,
        studentId: enrollment?.studentId,
        enrollmentId: grade.enrollmentId,
        oldValues: old,
        newValues: { score, comments },
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.json({ success: true, data: grade, message: 'Calificación actualizada' });
  } catch {
    await tx.rollback();
    res.status(500).json({ success: false, error: 'Error al actualizar calificación' });
  }
};

// ── DELETE /api/grades/:id ────────────────────────────────────────────────────

export const deleteGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    if (!grade) {
      res.status(404).json({ success: false, error: 'Calificación no encontrada' });
      return;
    }
    await grade.destroy();
    res.json({ success: true, message: 'Calificación eliminada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar calificación' });
  }
};

// Re-export for backward-compat
export { calculateWeightedAverage, isPassed };

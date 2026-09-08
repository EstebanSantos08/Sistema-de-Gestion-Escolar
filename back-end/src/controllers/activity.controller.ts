import { Request, Response } from 'express';
import sequelize from '../config/database';
import { Activity, Course, Enrollment, Submission, Student, User } from '../models/index';
import {
  getTeacherProfile,
  requireTeacherOwnsCourse,
  getStudentProfile,
  requireStudentEnrolled,
} from '../services/scope.service';
import { createAuditLog, extractIp } from '../services/auditLog.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveTeacherOrFail(
  userId: number,
  res: Response
): Promise<import('../models/Teacher').TeacherAttributes | null> {
  const teacher = await getTeacherProfile(userId);
  if (!teacher) {
    res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' });
    return null;
  }
  return teacher;
}

// ── GET /api/activities?courseId=&type=&status= ───────────────────────────────

export const getActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = Number(req.query.courseId);
    if (!courseId) {
      res.status(400).json({ success: false, error: 'courseId es requerido' });
      return;
    }

    const role = req.user!.role;

    if (role === 'teacher') {
      const teacher = await resolveTeacherOrFail(req.user!.id, res);
      if (!teacher) return;
      const course = await requireTeacherOwnsCourse(teacher.id, courseId);
      if (!course) {
        res.status(403).json({ success: false, error: 'No tienes acceso a este curso' });
        return;
      }
    } else if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student) { res.status(403).json({ success: false, error: 'Perfil de estudiante no encontrado' }); return; }
      const enrollment = await requireStudentEnrolled(student.id, courseId);
      if (!enrollment) { res.status(403).json({ success: false, error: 'No estás matriculado en este curso' }); return; }
    }
    // admin & parent: no extra scope check

    const where: Record<string, unknown> = { courseId };
    if (req.query.type) where.type = req.query.type;
    if (req.query.status) where.status = req.query.status;

    const activities = await Activity.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: activities });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── GET /api/activities/:id ───────────────────────────────────────────────────

export const getActivityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'name', 'teacherId'] }],
    });
    if (!activity) {
      res.status(404).json({ success: false, error: 'Actividad no encontrada' });
      return;
    }

    const role = req.user!.role;
    if (role === 'teacher') {
      const teacher = await resolveTeacherOrFail(req.user!.id, res);
      if (!teacher) return;
      const course = await requireTeacherOwnsCourse(teacher.id, activity.courseId);
      if (!course) { res.status(403).json({ success: false, error: 'Acceso denegado' }); return; }
    } else if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student) { res.status(403).json({ success: false, error: 'Perfil de estudiante no encontrado' }); return; }
      const enrollment = await requireStudentEnrolled(student.id, activity.courseId);
      if (!enrollment) { res.status(403).json({ success: false, error: 'No estás matriculado en este curso' }); return; }
    }

    res.json({ success: true, data: activity });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── POST /api/activities ──────────────────────────────────────────────────────

export const createActivity = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const { courseId, title, description, dueDate, type, status, maxScore } = req.body as {
      courseId: number; title: string; description?: string;
      dueDate?: string; type?: Activity['type']; status?: Activity['status'];
      maxScore?: number;
    };

    if (req.user!.role === 'teacher') {
      const teacher = await resolveTeacherOrFail(req.user!.id, res);
      if (!teacher) { await tx.rollback(); return; }
      const course = await requireTeacherOwnsCourse(teacher.id, courseId);
      if (!course) {
        await tx.rollback();
        res.status(403).json({ success: false, error: 'No tienes permiso para crear actividades en este curso' });
        return;
      }
    } else {
      // admin
      const course = await Course.findByPk(courseId);
      if (!course) {
        await tx.rollback();
        res.status(404).json({ success: false, error: 'Curso no encontrado' });
        return;
      }
    }

    const activity = await Activity.create(
      {
        courseId: Number(courseId),
        title,
        description: description ?? null,
        dueDate: dueDate ?? null,
        type: type ?? 'deber',
        status: status ?? 'en_curso',
        maxScore: maxScore ?? 10,
      },
      { transaction: tx }
    );

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ACTIVITY_CREATED',
      resource: 'activities',
      resourceId: activity.id,
      details: {
        actorRole: req.user!.role,
        courseId: activity.courseId,
        activityTitle: activity.title,
        activityId: activity.id,
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.status(201).json({ success: true, data: activity, message: 'Actividad creada' });
  } catch (err) {
    await tx.rollback();
    console.error(err);
    res.status(500).json({ success: false, error: 'Error al crear actividad' });
  }
};

// ── PUT /api/activities/:id ───────────────────────────────────────────────────

export const updateActivity = async (req: Request, res: Response): Promise<void> => {
  const tx = await sequelize.transaction();
  try {
    const activity = await Activity.findByPk(req.params.id, { transaction: tx });
    if (!activity) {
      await tx.rollback();
      res.status(404).json({ success: false, error: 'Actividad no encontrada' });
      return;
    }

    if (req.user!.role === 'teacher') {
      const teacher = await resolveTeacherOrFail(req.user!.id, res);
      if (!teacher) { await tx.rollback(); return; }
      const course = await requireTeacherOwnsCourse(teacher.id, activity.courseId);
      if (!course) {
        await tx.rollback();
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const oldValues = {
      title: activity.title,
      description: activity.description,
      dueDate: activity.dueDate,
      type: activity.type,
      status: activity.status,
      maxScore: activity.maxScore,
    };

    const { title, description, dueDate, type, status, maxScore } = req.body as Partial<{
      title: string; description: string; dueDate: string;
      type: Activity['type']; status: Activity['status']; maxScore: number;
    }>;

    if (title !== undefined) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (dueDate !== undefined) activity.dueDate = dueDate;
    if (type !== undefined) activity.type = type;
    if (status !== undefined) activity.status = status;
    if (maxScore !== undefined) activity.maxScore = maxScore;

    await activity.save({ transaction: tx });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ACTIVITY_UPDATED',
      resource: 'activities',
      resourceId: activity.id,
      details: {
        actorRole: req.user!.role,
        courseId: activity.courseId,
        activityId: activity.id,
        activityTitle: activity.title,
        oldValues,
        newValues: { title, description, dueDate, type, status, maxScore },
      },
      ipAddress: extractIp(req),
      transaction: tx,
    });

    await tx.commit();
    res.json({ success: true, data: activity, message: 'Actividad actualizada' });
  } catch {
    await tx.rollback();
    res.status(500).json({ success: false, error: 'Error al actualizar actividad' });
  }
};

// ── GET /api/activities/:id/submissions (teacher: all; student: own) ──────────

export const getActivitySubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const activityId = Number(req.params.id);
    const role = req.user!.role;

    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      res.status(404).json({ success: false, error: 'Actividad no encontrada' });
      return;
    }

    if (role === 'teacher') {
      const teacher = await resolveTeacherOrFail(req.user!.id, res);
      if (!teacher) return;
      const course = await requireTeacherOwnsCourse(teacher.id, activity.courseId);
      if (!course) { res.status(403).json({ success: false, error: 'Acceso denegado' }); return; }

      const submissions = await Submission.findAll({
        where: { activityId },
        include: [
          { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        ],
        order: [['createdAt', 'ASC']],
      });
      res.json({ success: true, data: submissions });
      return;
    }

    if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student) { res.status(403).json({ success: false, error: 'Perfil de estudiante no encontrado' }); return; }
      const enrollment = await requireStudentEnrolled(student.id, activity.courseId);
      if (!enrollment) { res.status(403).json({ success: false, error: 'No estás matriculado en este curso' }); return; }

      const submission = await Submission.findOne({ where: { activityId, studentId: student.id } });
      res.json({ success: true, data: submission ?? null });
      return;
    }

    // admin
    const submissions = await Submission.findAll({
      where: { activityId },
      include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] }],
    });
    res.json({ success: true, data: submissions });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

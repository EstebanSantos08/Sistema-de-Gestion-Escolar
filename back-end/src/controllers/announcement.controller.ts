import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Announcement, Course, User, Student, Enrollment } from '../models/index';
import {
  getTeacherProfile,
  requireTeacherOwnsCourse,
  getStudentProfile,
} from '../services/scope.service';
import { createAuditLog, extractIp } from '../services/auditLog.service';

const VALID_ROLES = ['ALL', 'TEACHER', 'STUDENT', 'PARENT'] as const;

// ── GET /api/announcements ───────────────────────────────────────────────────

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;
    const where: Record<string | symbol, unknown> = {};

    if (role === 'admin') {
      if (req.query.courseId) where.courseId = Number(req.query.courseId);
      if (req.query.targetRole) where.targetRole = req.query.targetRole;
    } else if (role === 'teacher') {
      const teacher = await getTeacherProfile(req.user!.id);
      if (!teacher) {
        res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' });
        return;
      }

      const teacherCourses = await Course.findAll({
        where: { teacherId: teacher.id, active: true },
        attributes: ['id'],
      });
      const teacherCourseIds = teacherCourses.map((c) => c.id);

      if (req.query.courseId) {
        const courseId = Number(req.query.courseId);
        const course = await requireTeacherOwnsCourse(teacher.id, courseId);
        if (!course) {
          res.status(403).json({ success: false, error: 'No tienes acceso a este curso' });
          return;
        }
        where.courseId = courseId;
      } else {
        // Teacher sees: announcements for their courses, global/teacher targeted, or authored by them
        where[Op.or] = [
          { authorId: req.user!.id },
          { targetRole: { [Op.in]: ['ALL', 'TEACHER'] } },
          { courseId: { [Op.in]: teacherCourseIds } },
        ];
      }
    } else if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student) {
        res.status(403).json({ success: false, error: 'Perfil de estudiante no encontrado' });
        return;
      }

      const enrollments = await Enrollment.findAll({
        where: { studentId: student.id, status: 'active' },
        attributes: ['courseId'],
      });
      const enrolledCourseIds = enrollments.map((e) => e.courseId);

      where.targetRole = { [Op.in]: ['ALL', 'STUDENT'] };
      where[Op.or] = [
        { courseId: null },
        { courseId: { [Op.in]: enrolledCourseIds } },
      ];
    } else if (role === 'parent') {
      where.targetRole = { [Op.in]: ['ALL', 'PARENT'] };
      // Global announcements for parents
      where.courseId = null;
    } else {
      res.status(403).json({ success: false, error: 'Acceso no autorizado' });
      return;
    }

    const announcements = await Announcement.findAll({
      where,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── GET /api/announcements/:id ───────────────────────────────────────────────

export const getAnnouncementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.findByPk(req.params.id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    if (!announcement) {
      res.status(404).json({ success: false, error: 'Comunicado no encontrado' });
      return;
    }

    const role = req.user!.role;

    if (role === 'student') {
      if (!['ALL', 'STUDENT'].includes(announcement.targetRole)) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
      if (announcement.courseId) {
        const student = await getStudentProfile(req.user!.id);
        if (!student) {
          res.status(403).json({ success: false, error: 'Acceso denegado' });
          return;
        }
        const isEnrolled = await Enrollment.findOne({
          where: { studentId: student.id, courseId: announcement.courseId, status: 'active' },
        });
        if (!isEnrolled) {
          res.status(403).json({ success: false, error: 'Acceso denegado' });
          return;
        }
      }
    } else if (role === 'teacher') {
      if (announcement.authorId !== req.user!.id && !['ALL', 'TEACHER'].includes(announcement.targetRole)) {
        const teacher = await getTeacherProfile(req.user!.id);
        if (announcement.courseId && teacher) {
          const ownsCourse = await requireTeacherOwnsCourse(teacher.id, announcement.courseId);
          if (!ownsCourse) {
            res.status(403).json({ success: false, error: 'Acceso denegado' });
            return;
          }
        } else {
          res.status(403).json({ success: false, error: 'Acceso denegado' });
          return;
        }
      }
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── POST /api/announcements ──────────────────────────────────────────────────

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const role = req.user!.role;
  if (role !== 'teacher' && role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acceso denegado: solo docentes o administradores pueden publicar comunicados' });
    return;
  }

  const { title, content, targetRole = 'ALL', courseId } = req.body as {
    title: string;
    content: string;
    targetRole?: 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';
    courseId?: number | null;
  };

  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ success: false, error: 'El título y el contenido son requeridos' });
    return;
  }

  if (!VALID_ROLES.includes(targetRole)) {
    res.status(400).json({ success: false, error: `targetRole inválido. Valores permitidos: ${VALID_ROLES.join(', ')}` });
    return;
  }

  let finalCourseId: number | null = courseId ? Number(courseId) : null;

  if (role === 'teacher') {
    const teacher = await getTeacherProfile(req.user!.id);
    if (!teacher) {
      res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' });
      return;
    }

    if (!finalCourseId) {
      res.status(400).json({ success: false, error: 'Los docentes deben especificar el curso autorizado para el comunicado' });
      return;
    }

    const course = await requireTeacherOwnsCourse(teacher.id, finalCourseId);
    if (!course) {
      res.status(403).json({ success: false, error: 'No tienes acceso a este curso' });
      return;
    }
  }

  const t = await sequelize.transaction();
  try {
    // authorId always resolved from authenticated JWT context, never trusted from client
    const announcement = await Announcement.create(
      {
        title: title.trim(),
        content: content.trim(),
        targetRole,
        courseId: finalCourseId,
        authorId: req.user!.id,
      },
      { transaction: t }
    );

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ANNOUNCEMENT_CREATED',
      resource: 'Announcement',
      resourceId: announcement.id,
      details: {
        actorRole: req.user!.role,
        courseId: finalCourseId ?? undefined,
        title: announcement.title,
        targetRole: announcement.targetRole,
        newValues: {
          title: announcement.title,
          content: announcement.content,
          targetRole: announcement.targetRole,
          courseId: finalCourseId,
        },
      },
      ipAddress: extractIp(req),
      transaction: t,
    });

    await t.commit();
    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: 'Error al crear comunicado' });
  }
};

// ── PUT /api/announcements/:id ───────────────────────────────────────────────

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const role = req.user!.role;
  if (role !== 'teacher' && role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acceso denegado: solo docentes o administradores pueden editar comunicados' });
    return;
  }

  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    res.status(404).json({ success: false, error: 'Comunicado no encontrado' });
    return;
  }

  // Teachers may only update announcements they authored
  if (role === 'teacher' && announcement.authorId !== req.user!.id) {
    res.status(403).json({ success: false, error: 'No tienes permiso para editar este comunicado' });
    return;
  }

  const { title, content, targetRole, courseId } = req.body as {
    title?: string;
    content?: string;
    targetRole?: 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';
    courseId?: number | null;
  };

  if (targetRole && !VALID_ROLES.includes(targetRole)) {
    res.status(400).json({ success: false, error: `targetRole inválido. Valores permitidos: ${VALID_ROLES.join(', ')}` });
    return;
  }

  if (role === 'teacher' && courseId !== undefined && courseId !== null) {
    const teacher = await getTeacherProfile(req.user!.id);
    if (!teacher) {
      res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' });
      return;
    }
    const course = await requireTeacherOwnsCourse(teacher.id, Number(courseId));
    if (!course) {
      res.status(403).json({ success: false, error: 'No tienes acceso al curso especificado' });
      return;
    }
  }

  const t = await sequelize.transaction();
  try {
    const oldValues = {
      title: announcement.title,
      content: announcement.content,
      targetRole: announcement.targetRole,
      courseId: announcement.courseId,
    };

    if (title?.trim()) announcement.title = title.trim();
    if (content?.trim()) announcement.content = content.trim();
    if (targetRole) announcement.targetRole = targetRole;
    if (courseId !== undefined) announcement.courseId = courseId ? Number(courseId) : null;

    await announcement.save({ transaction: t });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ANNOUNCEMENT_UPDATED',
      resource: 'Announcement',
      resourceId: announcement.id,
      details: {
        actorRole: req.user!.role,
        courseId: announcement.courseId ?? undefined,
        title: announcement.title,
        oldValues,
        newValues: {
          title: announcement.title,
          content: announcement.content,
          targetRole: announcement.targetRole,
          courseId: announcement.courseId,
        },
      },
      ipAddress: extractIp(req),
      transaction: t,
    });

    await t.commit();
    res.json({ success: true, data: announcement });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: 'Error al actualizar comunicado' });
  }
};

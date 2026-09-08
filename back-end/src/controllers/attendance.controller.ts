import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Attendance, Student, Course, Enrollment, User } from '../models/index';
import {
  getTeacherProfile,
  requireTeacherOwnsCourse,
  getStudentProfile,
  requireStudentEnrolled,
} from '../services/scope.service';
import { createAuditLog, extractIp } from '../services/auditLog.service';

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
type AttendanceStatusType = typeof VALID_STATUSES[number];

// ── GET /api/attendance ───────────────────────────────────────────────────────

export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;
    const where: Record<string, unknown> = {};

    if (req.query.date) {
      where.date = req.query.date;
    }

    if (role === 'teacher') {
      const teacher = await getTeacherProfile(req.user!.id);
      if (!teacher) {
        res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' });
        return;
      }

      if (req.query.courseId) {
        const courseId = Number(req.query.courseId);
        const course = await requireTeacherOwnsCourse(teacher.id, courseId);
        if (!course) {
          res.status(403).json({ success: false, error: 'No tienes acceso a este curso' });
          return;
        }
        where.courseId = courseId;
      } else {
        const teacherCourses = await Course.findAll({
          where: { teacherId: teacher.id, active: true },
          attributes: ['id'],
        });
        const courseIds = teacherCourses.map((c) => c.id);
        where.courseId = { [Op.in]: courseIds };
      }

      if (req.query.studentId) {
        where.studentId = Number(req.query.studentId);
      }
    } else if (role === 'student') {
      const student = await getStudentProfile(req.user!.id);
      if (!student) {
        res.status(403).json({ success: false, error: 'Perfil de estudiante no encontrado' });
        return;
      }

      where.studentId = student.id;

      if (req.query.courseId) {
        const courseId = Number(req.query.courseId);
        const enrollment = await requireStudentEnrolled(student.id, courseId);
        if (!enrollment) {
          res.status(403).json({ success: false, error: 'No estás matriculado en este curso' });
          return;
        }
        where.courseId = courseId;
      }
    } else if (role === 'admin') {
      if (req.query.courseId) where.courseId = Number(req.query.courseId);
      if (req.query.studentId) where.studentId = Number(req.query.studentId);
    } else {
      // Parent or other roles
      res.status(403).json({ success: false, error: 'Acceso no autorizado' });
      return;
    }

    const attendances = await Attendance.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: User,
          as: 'registeredBy',
          attributes: ['id', 'name'],
        },
      ],
      order: [['date', 'DESC'], ['studentId', 'ASC']],
    });

    res.json({ success: true, data: attendances });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── PUT /api/attendance/batch ─────────────────────────────────────────────────

interface AttendanceBatchRow {
  studentId: number;
  status: string;
  remarks?: string | null;
}

export const saveAttendanceBatch = async (req: Request, res: Response): Promise<void> => {
  const role = req.user!.role;
  if (role !== 'teacher' && role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acceso denegado: solo docentes o administradores pueden registrar asistencia' });
    return;
  }

  const { courseId, date, attendance } = req.body as {
    courseId: number;
    date: string;
    attendance: AttendanceBatchRow[];
  };

  if (!courseId || !date || !Array.isArray(attendance) || attendance.length === 0) {
    res.status(400).json({ success: false, error: 'courseId, date y lista de asistencia son requeridos' });
    return;
  }

  // Validate date string (YYYY-MM-DD)
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ success: false, error: 'Fecha inválida, debe tener formato YYYY-MM-DD' });
    return;
  }

  // Validate teacher course ownership
  if (role === 'teacher') {
    const teacher = await getTeacherProfile(req.user!.id);
    if (!teacher) {
      res.status(403).json({ success: false, error: 'Perfil de docente no encontrado' });
      return;
    }
    const course = await requireTeacherOwnsCourse(teacher.id, Number(courseId));
    if (!course) {
      res.status(403).json({ success: false, error: 'No tienes acceso a este curso' });
      return;
    }
  }

  // Validate status values
  for (const row of attendance) {
    const norm = (row.status || '').toUpperCase() as AttendanceStatusType;
    if (!VALID_STATUSES.includes(norm)) {
      res.status(400).json({
        success: false,
        error: `Estado de asistencia inválido: "${row.status}". Valores permitidos: ${VALID_STATUSES.join(', ')}`,
      });
      return;
    }
  }

  // Verify all students are enrolled in this course (no cross-course IDs)
  const studentIds = Array.from(new Set(attendance.map((r) => Number(r.studentId))));
  const enrollments = await Enrollment.findAll({
    where: {
      courseId: Number(courseId),
      studentId: { [Op.in]: studentIds },
      status: 'active',
    },
    attributes: ['studentId'],
  });

  const enrolledSet = new Set(enrollments.map((e) => e.studentId));
  const unenrolled = studentIds.filter((id) => !enrolledSet.has(id));
  if (unenrolled.length > 0) {
    res.status(400).json({
      success: false,
      error: `Uno o más estudiantes no están matriculados en este curso: ${unenrolled.join(', ')}`,
    });
    return;
  }

  // Single transaction for batch persistence and audit logs
  const t = await sequelize.transaction();
  try {
    const resultRecords: Attendance[] = [];

    for (const row of attendance) {
      const studentId = Number(row.studentId);
      const normStatus = (row.status || '').toUpperCase() as AttendanceStatusType;
      const remarks = row.remarks?.trim() || null;

      // Application-level lookup to prevent duplicate records (DB UNIQUE depends on migration 002)
      const existing = await Attendance.findOne({
        where: { studentId, courseId: Number(courseId), date },
        transaction: t,
      });

      if (existing) {
        const oldStatus = existing.status;
        const oldRemarks = existing.remarks;
        const hasChanged = oldStatus !== normStatus || oldRemarks !== remarks;

        if (hasChanged) {
          existing.status = normStatus;
          existing.remarks = remarks;
          existing.registeredById = req.user!.id;
          await existing.save({ transaction: t });

          await createAuditLog({
            actorUserId: req.user!.id,
            action: 'ATTENDANCE_UPDATED',
            resource: 'Attendance',
            resourceId: existing.id,
            details: {
              actorRole: req.user!.role,
              studentId,
              courseId: Number(courseId),
              date,
              oldValues: { status: oldStatus, remarks: oldRemarks },
              newValues: { status: normStatus, remarks },
            },
            ipAddress: extractIp(req),
            transaction: t,
          });
        }
        resultRecords.push(existing);
      } else {
        const created = await Attendance.create(
          {
            studentId,
            courseId: Number(courseId),
            date,
            status: normStatus,
            remarks,
            registeredById: req.user!.id,
          },
          { transaction: t }
        );

        await createAuditLog({
          actorUserId: req.user!.id,
          action: 'ATTENDANCE_SAVED',
          resource: 'Attendance',
          resourceId: created.id,
          details: {
            actorRole: req.user!.role,
            studentId,
            courseId: Number(courseId),
            date,
            newValues: { status: normStatus, remarks },
          },
          ipAddress: extractIp(req),
          transaction: t,
        });

        resultRecords.push(created);
      }
    }

    await t.commit();
    res.json({
      success: true,
      data: {
        count: resultRecords.length,
        records: resultRecords,
      },
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: 'Error al guardar lote de asistencia' });
  }
};

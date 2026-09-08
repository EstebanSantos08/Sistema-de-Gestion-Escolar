import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { AuditLog, User, Student, Teacher, Course, Activity } from '../models/index';

// ── GET /api/audit-logs ───────────────────────────────────────────────────────

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    // ── Filters ────────────────────────────────────────────────────────────────
    const where: Record<string, unknown> = {};

    if (req.query.from) {
      where.createdAt = {
        ...(where.createdAt as object ?? {}),
        [Op.gte]: new Date(req.query.from as string),
      };
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to as string);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        ...(where.createdAt as object ?? {}),
        [Op.lte]: toDate,
      };
    }

    // Filter by action category (task / academic)
    if (req.query.gradeCategory) {
      const category = req.query.gradeCategory as string;
      const taskActions = ['TASK_GRADE_CREATED', 'TASK_GRADE_UPDATED'];
      const academicActions = ['ACADEMIC_GRADE_CREATED', 'ACADEMIC_GRADE_UPDATED'];
      where.action = category === 'task'
        ? { [Op.in]: taskActions }
        : category === 'academic'
          ? { [Op.in]: academicActions }
          : { [Op.ne]: null };
    }

    // Filter by action type (created / modified)
    if (req.query.action) {
      const actionFilter = req.query.action as string;
      if (actionFilter === 'created') {
        where.action = { [Op.like]: '%_CREATED' };
      } else if (req.query.action === 'modified') {
        where.action = {
          [Op.or]: [
            { [Op.like]: '%_UPDATED' },
            { [Op.like]: '%_REPLACED' },
            { [Op.like]: '%_SAVED' },
          ],
        };
      }
    }

    // teacher filter: find userId for the teacher
    if (req.query.teacher) {
      const teacherId = Number(req.query.teacher);
      const teacher = await Teacher.findByPk(teacherId, { attributes: ['userId'] });
      if (teacher) {
        where.userId = teacher.userId;
      } else {
        res.json({ success: true, data: { logs: [], total: 0, page, limit, totalPages: 0 } });
        return;
      }
    }

    // student filter: filter via JSONB details.studentId
    let studentIdFilter: number | undefined;
    if (req.query.student) {
      studentIdFilter = Number(req.query.student);
    }

    // course / activity filters (applied post-query via details JSON)
    const courseIdFilter = req.query.course ? Number(req.query.course) : undefined;
    const activityIdFilter = req.query.activity ? Number(req.query.activity) : undefined;

    let { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Post-filter by student / course / activity via details JSON
    // (In production with PostgreSQL JSONB indexing this would use a WHERE clause)
    if (studentIdFilter || courseIdFilter || activityIdFilter) {
      rows = rows.filter((log) => {
        let details: Record<string, unknown> = {};
        try {
          if (log.details) details = JSON.parse(log.details) as Record<string, unknown>;
        } catch { /* ignore malformed */ }

        if (studentIdFilter && details.studentId !== studentIdFilter) return false;
        if (courseIdFilter && details.courseId !== courseIdFilter) return false;
        if (activityIdFilter && details.activityId !== activityIdFilter) return false;
        return true;
      });
    }

    // Shape response: WHO, WHAT, STUDENT, COURSE, ACTIVITY, WHEN, OLD/NEW
    const normalizedLogs = rows.map((log) => {
      let details: Record<string, unknown> = {};
      try {
        if (log.details) details = JSON.parse(log.details) as Record<string, unknown>;
      } catch { /* ignore */ }

      return {
        id: log.id,
        when: log.createdAt,
        what: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        // WHO
        actor: {
          userId: log.userId,
          name: (log.user as { name?: string } | undefined)?.name,
          email: (log.user as { email?: string } | undefined)?.email,
          role: (log.user as { role?: string } | undefined)?.role ?? details.actorRole,
        },
        // STUDENT
        studentId: details.studentId,
        studentName: details.studentName,
        // COURSE
        courseId: details.courseId,
        courseName: details.courseName,
        // ACTIVITY
        activityId: details.activityId,
        activityTitle: details.activityTitle,
        // Grade category
        gradeCategory: details.gradeCategory,
        // DIFF
        oldValues: details.oldValues,
        newValues: details.newValues,
        // IP
        ipAddress: log.ipAddress,
      };
    });

    res.json({
      success: true,
      data: {
        logs: normalizedLogs,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ── GET /api/audit-logs/filters — provide filter options ────────────────────

export const getAuditLogFilters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [teachers, students, courses, activities] = await Promise.all([
      Teacher.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'name'], where: { active: true } }],
        attributes: ['id'],
      }),
      Student.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'name'], where: { active: true } }],
        attributes: ['id'],
      }),
      Course.findAll({ attributes: ['id', 'name', 'code'], where: { active: true } }),
      Activity.findAll({ attributes: ['id', 'title', 'courseId'] }),
    ]);

    res.json({
      success: true,
      data: {
        teachers: teachers.map((t) => ({
          id: t.id,
          name: (t.user as { name?: string } | undefined)?.name,
        })),
        students: students.map((s) => ({
          id: s.id,
          name: (s.user as { name?: string } | undefined)?.name,
        })),
        courses: courses.map((c) => ({ id: c.id, name: c.name, code: c.code })),
        activities: activities.map((a) => ({
          id: a.id,
          title: a.title,
          courseId: a.courseId,
        })),
        gradeCategories: [
          { value: 'task', label: 'Nota de tarea / actividad' },
          { value: 'academic', label: 'Nota académica' },
        ],
        actions: [
          { value: 'created', label: 'Creado' },
          { value: 'modified', label: 'Modificado' },
        ],
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener filtros' });
  }
};

// ── Shared sequelize instance for audit-only queries (used in tests) ─────────
export { sequelize };

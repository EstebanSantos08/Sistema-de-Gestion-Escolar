import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Course, Teacher, User, Enrollment, Student, Grade } from '../models/index';
import { calculateWeightedAverage, isPassed } from '../utils/grades';

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { period, teacherId, search } = req.query;

    const where: Record<string, unknown> = {};
    if (period) where.period = period;
    if (teacherId) where.teacherId = teacherId;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const { rows, count } = await Course.findAndCountAll({
      where,
      include: [
        {
          model: Teacher, as: 'teacher',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        },
        { model: Enrollment, as: 'enrollments', where: { status: 'active' }, required: false },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const result = rows.map(c => ({
      ...c.toJSON(),
      enrolledCount: (c.enrollments as unknown as Enrollment[])?.length ?? 0,
    }));

    res.json({
      success: true,
      data: { courses: result, total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Teacher, as: 'teacher',
          include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
        },
        {
          model: Enrollment, as: 'enrollments',
          include: [
            { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
            { model: Grade, as: 'grades' },
          ],
        },
      ],
    });

    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado' });
      return;
    }

    type EnrollmentWithData = Enrollment & { grades?: Grade[]; student?: Student & { user?: User } };
    const enrollments = (course.enrollments as EnrollmentWithData[]) ?? [];
    const studentsWithAverages = enrollments.map(e => ({
      enrollmentId: e.id,
      student: e.student,
      status: e.status,
      weightedAverage: calculateWeightedAverage((e.grades ?? []).map((g: Grade) => ({ score: g.score, weight: g.weight }))),
      passed: isPassed(calculateWeightedAverage((e.grades ?? []).map((g: Grade) => ({ score: g.score, weight: g.weight })))),
    }));

    res.json({ success: true, data: { ...course.toJSON(), students: studentsWithAverages } });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, description, credits, period, teacherId } = req.body as Record<string, string | number>;

    const existing = await Course.findOne({ where: { code } });
    if (existing) {
      res.status(409).json({ success: false, error: 'El código de curso ya existe' });
      return;
    }

    const course = await Course.create({
      name: String(name),
      code: String(code),
      description: String(description || ''),
      credits: Number(credits || 3),
      period: String(period),
      teacherId: Number(teacherId),
      active: true,
    });

    res.status(201).json({ success: true, data: course, message: 'Curso creado correctamente' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al crear curso' });
  }
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado' });
      return;
    }
    const { name, description, credits, period, teacherId, active } = req.body as Record<string, unknown>;
    if (name !== undefined) course.name = String(name);
    if (description !== undefined) course.description = String(description);
    if (credits !== undefined) course.credits = Number(credits);
    if (period !== undefined) course.period = String(period);
    if (teacherId !== undefined) course.teacherId = Number(teacherId);
    if (active !== undefined) course.active = Boolean(active);
    await course.save();
    res.json({ success: true, data: course, message: 'Curso actualizado' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al actualizar curso' });
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado' });
      return;
    }
    const activeEnrollments = await Enrollment.count({ where: { courseId: course.id, status: 'active' } });
    if (activeEnrollments > 0) {
      res.status(409).json({ success: false, error: 'No se puede eliminar: el curso tiene matrículas activas' });
      return;
    }
    await course.destroy();
    res.json({ success: true, message: 'Curso eliminado' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar curso' });
  }
};

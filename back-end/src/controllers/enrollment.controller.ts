import { Request, Response } from 'express';
import { Enrollment, Student, Course, Grade, User, Teacher } from '../models/index';
import { calculateWeightedAverage, isPassed } from '../utils/grades';

export const getEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { courseId, period, status } = req.query;

    const where: Record<string, unknown> = {};
    if (courseId) where.courseId = courseId;
    if (period) where.period = period;
    if (status) where.status = status;

    const { rows, count } = await Enrollment.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }] },
        { model: Course, as: 'course' },
      ],
      limit,
      offset,
      order: [['enrolledAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { enrollments: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const createEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, courseId, period } = req.body as { studentId: number; courseId: number; period: string };

    const existing = await Enrollment.findOne({ where: { studentId, courseId, period } });
    if (existing) {
      res.status(409).json({ success: false, error: 'El estudiante ya está matriculado en este curso para este período' });
      return;
    }

    const enrollment = await Enrollment.create({ studentId, courseId, period, status: 'active' });
    res.status(201).json({ success: true, data: enrollment, message: 'Matrícula registrada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al crear matrícula' });
  }
};

export const updateEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Matrícula no encontrada' });
      return;
    }
    const { status } = req.body as { status: 'active' | 'withdrawn' | 'completed' };
    enrollment.status = status;
    await enrollment.save();
    res.json({ success: true, data: enrollment, message: 'Matrícula actualizada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al actualizar matrícula' });
  }
};

export const deleteEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Matrícula no encontrada' });
      return;
    }
    const gradesCount = await Grade.count({ where: { enrollmentId: enrollment.id } });
    if (gradesCount > 0) {
      res.status(409).json({ success: false, error: 'No se puede eliminar: la matrícula tiene calificaciones registradas' });
      return;
    }
    await enrollment.destroy();
    res.json({ success: true, message: 'Matrícula eliminada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar matrícula' });
  }
};

export const getEnrollmentsByCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = Number(req.params.courseId);

    // Teachers can only access their own courses
    if (req.user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { userId: req.user.id } });
      const course = await Course.findByPk(courseId);
      if (!teacher || course?.teacherId !== teacher.id) {
        res.status(403).json({ success: false, error: 'Acceso denegado: este no es tu curso' });
        return;
      }
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado' });
      return;
    }

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }] },
        { model: Grade, as: 'grades' },
      ],
    });

    const students = enrollments.map(e => {
      const grades = (e.grades as Grade[]) ?? [];
      const weightedAverage = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
      return {
        enrollmentId: e.id,
        studentId: e.studentId,
        studentCode: (e.student as Student)?.studentCode,
        name: ((e.student as Student & { user?: User })?.user as User)?.name,
        status: e.status,
        gradesCount: grades.length,
        weightedAverage,
        passed: isPassed(weightedAverage),
      };
    });

    res.json({
      success: true,
      data: {
        course: { id: course.id, name: course.name, period: course.period },
        students,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

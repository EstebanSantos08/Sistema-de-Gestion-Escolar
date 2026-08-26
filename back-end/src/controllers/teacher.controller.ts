import { Request, Response } from 'express';
import { Teacher, User, Course, Enrollment } from '../models/index';

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await Teacher.findAll({
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] }, where: { active: true } },
        { model: Course, as: 'courses', required: false },
      ],
      order: [[{ model: User, as: 'user' }, 'name', 'ASC']],
    });
    res.json({ success: true, data: teachers });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getTeacherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Course, as: 'courses' },
      ],
    });
    if (!teacher) {
      res.status(404).json({ success: false, error: 'Docente no encontrado' });
      return;
    }
    res.json({ success: true, data: teacher });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getMyCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findOne({ where: { userId: req.user!.id } });
    if (!teacher) {
      res.status(404).json({ success: false, error: 'Perfil de docente no encontrado' });
      return;
    }

    const period = (req.query.period as string) || process.env.ACTIVE_PERIOD || '2026-I';

    const courses = await Course.findAll({
      where: { teacherId: teacher.id, period, active: true },
      include: [
        {
          model: Enrollment, as: 'enrollments',
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    const result = courses.map(course => ({
      ...course.toJSON(),
      enrolledCount: (course.enrollments as Enrollment[])?.length ?? 0,
    }));

    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

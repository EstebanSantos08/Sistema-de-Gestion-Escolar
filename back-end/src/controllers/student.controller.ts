import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Student, User, Enrollment, Course, Grade, Teacher } from '../models/index';
import { calculateWeightedAverage, isPassed } from '../utils/grades';

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { search } = req.query;

    const userWhere: Record<string, unknown> = { active: true };
    if (search) {
      userWhere[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Student.findAndCountAll({
      include: [
        { model: User, as: 'user', where: userWhere, attributes: ['id', 'name', 'email', 'active'] },
      ],
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    res.json({
      success: true,
      data: { students: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    // Students can only see their own profile
    if (req.user?.role === 'student') {
      const myProfile = await Student.findOne({ where: { userId: req.user.id } });
      if (!myProfile || myProfile.id !== id) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const student = await Student.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        {
          model: Enrollment, as: 'enrollments',
          include: [{ model: Course, as: 'course' }],
        },
      ],
    });

    if (!student) {
      res.status(404).json({ success: false, error: 'Estudiante no encontrado' });
      return;
    }
    res.json({ success: true, data: student });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getStudentGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    let studentId = Number(req.params.id);

    // If student or parent role, find their associated student profile
    if (req.user?.role === 'student' || req.user?.role === 'parent' || studentId === 0) {
      let myProfile = req.user?.id ? await Student.findOne({ where: { userId: req.user.id } }) : null;
      if (!myProfile) {
        myProfile = await Student.findOne();
      }
      if (!myProfile) {
        res.status(404).json({ success: false, error: 'Perfil de estudiante no encontrado' });
        return;
      }
      studentId = myProfile.id;
    }

    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    });
    if (!student) {
      res.status(404).json({ success: false, error: 'Estudiante no encontrado' });
      return;
    }

    const period = (req.query.period as string) || process.env.ACTIVE_PERIOD || '2026-I';

    const enrollments = await Enrollment.findAll({
      where: { studentId, period },
      include: [
        {
          model: Course, as: 'course',
          include: [{ model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['name'] }] }],
        },
        { model: Grade, as: 'grades' },
      ],
    });

    const courses = enrollments.map((enrollment) => {
      const course = enrollment.course as (Course & { teacher?: Teacher & { user?: User } });
      const grades = (enrollment.grades as Grade[]) || [];
      const weightedAverage = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
      const passed = isPassed(weightedAverage);

      return {
        courseId: course?.id,
        courseName: course?.name,
        courseCode: course?.code,
        teacherName: (course?.teacher as unknown as { user?: { name: string } })?.user?.name ?? 'N/A',
        enrollmentId: enrollment.id,
        enrollmentStatus: enrollment.status,
        grades: grades.map(g => ({
          id: g.id,
          gradeType: g.gradeType,
          score: g.score,
          weight: g.weight,
          comments: g.comments,
          gradedAt: g.gradedAt,
        })),
        weightedAverage,
        passed,
      };
    });

    const validAverages = courses.filter(c => c.grades.length > 0).map(c => c.weightedAverage);
    const generalAverage = validAverages.length
      ? Number((validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: (student.user as unknown as { name: string })?.name,
          studentCode: student.studentCode,
        },
        period,
        courses,
        generalAverage,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getMyGrades = async (req: Request, res: Response): Promise<void> => {
  req.params.id = '0'; // will be overridden by role check in getStudentGrades
  await getStudentGrades(req, res);
};

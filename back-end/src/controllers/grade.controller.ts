import { Request, Response } from 'express';
import { Grade, Enrollment, Course, Student, User, Teacher } from '../models/index';

const GRADE_MIN = Number(process.env.GRADE_MIN ?? 0);
const GRADE_MAX = Number(process.env.GRADE_MAX ?? 10);

async function getTeacherForUser(userId: number): Promise<Teacher | null> {
  return Teacher.findOne({ where: { userId } });
}

async function verifyTeacherOwnsCourse(teacherId: number, courseId: number): Promise<boolean> {
  const course = await Course.findByPk(courseId);
  return course?.teacherId === teacherId;
}

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

export const createGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enrollmentId, gradeType, score, weight, comments } = req.body as {
      enrollmentId: number; gradeType: string; score: number; weight: number; comments: string;
    };

    if (score < GRADE_MIN || score > GRADE_MAX) {
      res.status(422).json({ success: false, error: `La nota debe estar entre ${GRADE_MIN} y ${GRADE_MAX}` });
      return;
    }
    if (weight < 0 || weight > 1) {
      res.status(422).json({ success: false, error: 'El peso debe estar entre 0 y 1' });
      return;
    }

    const enrollment = await Enrollment.findByPk(enrollmentId, { include: [{ model: Course, as: 'course' }] });
    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Matrícula no encontrada' });
      return;
    }

    if (req.user?.role === 'teacher') {
      const teacher = await getTeacherForUser(req.user.id);
      const courseId = (enrollment.course as Course)?.id ?? enrollment.courseId;
      if (!teacher || !(await verifyTeacherOwnsCourse(teacher.id, courseId))) {
        res.status(403).json({ success: false, error: 'No tienes permiso para calificar este curso' });
        return;
      }
    }

    const existing = await Grade.findOne({ where: { enrollmentId, gradeType } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Ya existe una nota de este tipo. Usa PUT para editar.' });
      return;
    }

    const grade = await Grade.create({
      enrollmentId,
      gradeType,
      score,
      weight: weight ?? 1.0,
      comments: comments || '',
      gradedById: req.user!.id,
    });

    res.status(201).json({ success: true, data: grade, message: 'Calificación registrada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al registrar calificación' });
  }
};

export const createGradeBatch = async (req: Request, res: Response): Promise<void> => {
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
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const results = await Promise.all(
      grades.map(async (g) => {
        const [grade] = await Grade.upsert({
          enrollmentId: g.enrollmentId,
          gradeType,
          score: g.score,
          weight: weight ?? 1.0,
          comments: g.comments || '',
          gradedById: req.user!.id,
          gradedAt: new Date(),
        });
        return grade;
      })
    );

    res.json({ success: true, data: results, message: `${results.length} calificaciones guardadas` });
  } catch {
    res.status(500).json({ success: false, error: 'Error al guardar calificaciones' });
  }
};

export const updateGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const grade = await Grade.findByPk(req.params.id, {
      include: [{ model: Enrollment, as: 'enrollment', include: [{ model: Course, as: 'course' }] }],
    });
    if (!grade) {
      res.status(404).json({ success: false, error: 'Calificación no encontrada' });
      return;
    }

    if (req.user?.role === 'teacher') {
      const teacher = await getTeacherForUser(req.user.id);
      const courseId = ((grade.enrollment as Enrollment & { course?: Course })?.course as Course)?.id;
      if (!teacher || !courseId || !(await verifyTeacherOwnsCourse(teacher.id, courseId))) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }

    const { score, comments } = req.body as { score?: number; comments?: string };
    if (score !== undefined) {
      if (score < GRADE_MIN || score > GRADE_MAX) {
        res.status(422).json({ success: false, error: `La nota debe estar entre ${GRADE_MIN} y ${GRADE_MAX}` });
        return;
      }
      grade.score = score;
    }
    if (comments !== undefined) grade.comments = comments;
    grade.gradedById = req.user!.id;
    grade.gradedAt = new Date();
    await grade.save();

    res.json({ success: true, data: grade, message: 'Calificación actualizada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al actualizar calificación' });
  }
};

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

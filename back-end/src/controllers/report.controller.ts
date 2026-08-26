import { Request, Response } from 'express';
import { Teacher, Course, Student } from '../models/index';
import {
  generateCourseGradesExcel, generateStudentGradesExcel, generateAllGradesExcel,
} from '../services/excel.service';
import {
  generateStudentBulletin, generateCourseAct, generateTranscript,
} from '../services/pdf.service';

async function teacherOwnsCourse(userId: number, courseId: number): Promise<boolean> {
  const teacher = await Teacher.findOne({ where: { userId } });
  if (!teacher) return false;
  const course = await Course.findByPk(courseId);
  return course?.teacherId === teacher.id;
}

// ─── Excel ────────────────────────────────────────────────────────────────────
export const excelCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = Number(req.params.courseId);
    if (req.user?.role === 'teacher' && !(await teacherOwnsCourse(req.user.id, courseId))) {
      res.status(403).json({ success: false, error: 'Acceso denegado' });
      return;
    }
    const course = await Course.findByPk(courseId);
    if (!course) { res.status(404).json({ success: false, error: 'Curso no encontrado' }); return; }

    const buffer = await generateCourseGradesExcel(courseId);
    const filename = `notas-${course.code}-${course.period}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al generar Excel' });
  }
};

export const excelStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    let studentId = Number(req.params.studentId);
    if (req.user?.role === 'student') {
      const me = await Student.findOne({ where: { userId: req.user.id } });
      if (!me) { res.status(404).json({ success: false, error: 'Perfil no encontrado' }); return; }
      studentId = me.id;
    }
    const student = await Student.findByPk(studentId);
    if (!student) { res.status(404).json({ success: false, error: 'Estudiante no encontrado' }); return; }

    const buffer = await generateStudentGradesExcel(studentId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="notas-${student.studentCode}.xlsx"`);
    res.send(buffer);
  } catch {
    res.status(500).json({ success: false, error: 'Error al generar Excel' });
  }
};

export const excelAllGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || process.env.ACTIVE_PERIOD || '2026-I';
    const buffer = await generateAllGradesExcel(period);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="todas-notas-${period}.xlsx"`);
    res.send(buffer);
  } catch {
    res.status(500).json({ success: false, error: 'Error al generar Excel' });
  }
};

// ─── PDF ──────────────────────────────────────────────────────────────────────
export const pdfStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    let studentId = Number(req.params.studentId);
    if (req.user?.role === 'student') {
      const me = await Student.findOne({ where: { userId: req.user.id } });
      if (!me) { res.status(404).json({ success: false, error: 'Perfil no encontrado' }); return; }
      studentId = me.id;
    }
    const student = await Student.findByPk(studentId);
    if (!student) { res.status(404).json({ success: false, error: 'Estudiante no encontrado' }); return; }

    const period = req.query.period as string | undefined;
    const buffer = await generateStudentBulletin(studentId, period);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="boletin-${student.studentCode}.pdf"`);
    res.send(buffer);
  } catch {
    res.status(500).json({ success: false, error: 'Error al generar PDF' });
  }
};

export const pdfCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = Number(req.params.courseId);
    if (req.user?.role === 'teacher' && !(await teacherOwnsCourse(req.user.id, courseId))) {
      res.status(403).json({ success: false, error: 'Acceso denegado' });
      return;
    }
    const course = await Course.findByPk(courseId);
    if (!course) { res.status(404).json({ success: false, error: 'Curso no encontrado' }); return; }

    const buffer = await generateCourseAct(courseId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="acta-${course.code}-${course.period}.pdf"`);
    res.send(buffer);
  } catch {
    res.status(500).json({ success: false, error: 'Error al generar PDF' });
  }
};

export const pdfTranscript = async (req: Request, res: Response): Promise<void> => {
  try {
    let studentId = Number(req.params.studentId);
    if (req.user?.role === 'student') {
      const me = await Student.findOne({ where: { userId: req.user.id } });
      if (!me) { res.status(404).json({ success: false, error: 'Perfil no encontrado' }); return; }
      studentId = me.id;
    }
    const student = await Student.findByPk(studentId);
    if (!student) { res.status(404).json({ success: false, error: 'Estudiante no encontrado' }); return; }

    const buffer = await generateTranscript(studentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="historial-${student.studentCode}.pdf"`);
    res.send(buffer);
  } catch {
    res.status(500).json({ success: false, error: 'Error al generar PDF' });
  }
};

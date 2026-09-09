import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Observation, Student, Teacher, User } from '../models/index';

type Visibility = 'ESTUDIANTE_Y_PADRES' | 'SOLO_ESTUDIANTE' | 'SOLO_DOCENTE';

async function getStudentIdForUser(req: Request): Promise<number | null> {
  const student = await Student.findOne({ where: { userId: req.user!.id }, attributes: ['id'] });
  return student?.id ?? null;
}

export const getObservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: Record<string, unknown> = {};
    if (req.user?.role === 'student') {
      const studentId = await getStudentIdForUser(req);
      if (!studentId) {
        res.status(404).json({ success: false, error: 'Perfil de estudiante no encontrado' });
        return;
      }
      where.studentId = studentId;
      where.visibility = { [Op.ne]: 'SOLO_DOCENTE' };
    } else if (req.user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
      if (!teacher) {
        res.status(404).json({ success: false, error: 'Perfil de docente no encontrado' });
        return;
      }
      where.teacherId = teacher.id;
    }

    const observations = await Observation.findAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        { model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
      ],
      order: [['date', 'DESC'], ['id', 'DESC']],
    });
    res.json({ success: true, data: observations });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getObservationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const observation = await Observation.findByPk(req.params.id);
    if (!observation) {
      res.status(404).json({ success: false, error: 'Observación no encontrada' });
      return;
    }
    if (req.user?.role === 'student') {
      const studentId = await getStudentIdForUser(req);
      if (!studentId || observation.studentId !== studentId || observation.visibility === 'SOLO_DOCENTE') {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    } else if (req.user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
      if (!teacher || observation.teacherId !== teacher.id) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }
    res.json({ success: true, data: observation });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const createObservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findOne({ where: { userId: req.user!.id }, attributes: ['id'] });
    if (!teacher && req.user?.role !== 'admin') {
      res.status(404).json({ success: false, error: 'Perfil de docente no encontrado' });
      return;
    }
    const { studentId, title, description, type, visibility } = req.body as {
      studentId: number; title: string; description: string;
      type?: 'ACADEMIC' | 'BEHAVIORAL' | 'GENERAL'; visibility?: Visibility;
    };
    const student = await Student.findByPk(studentId);
    if (!student) {
      res.status(404).json({ success: false, error: 'Estudiante no encontrado' });
      return;
    }
    const observation = await Observation.create({
      studentId, teacherId: teacher?.id ?? 0, title, description,
      type: type ?? 'GENERAL', visibility: visibility ?? 'ESTUDIANTE_Y_PADRES',
    });
    res.status(201).json({ success: true, data: observation });
  } catch {
    res.status(500).json({ success: false, error: 'Error al crear observación' });
  }
};

export const deleteObservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const observation = await Observation.findByPk(req.params.id);
    if (!observation) {
      res.status(404).json({ success: false, error: 'Observación no encontrada' });
      return;
    }
    if (req.user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
      if (!teacher || observation.teacherId !== teacher.id) {
        res.status(403).json({ success: false, error: 'Acceso denegado' });
        return;
      }
    }
    await observation.destroy();
    res.json({ success: true, message: 'Observación eliminada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar observación' });
  }
};
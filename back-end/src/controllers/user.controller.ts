import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { User, Student, Teacher } from '../models/index';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { role, search, active } = req.query;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (active !== undefined) where.active = active === 'true';
    if (search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Teacher, as: 'teacherProfile', required: false },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { users, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Student, as: 'studentProfile' },
        { model: Teacher, as: 'teacherProfile' },
      ],
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const {
      name, email, password, role,
      // student fields
      studentCode, birthDate, phone, address, guardianName, guardianPhone,
      // teacher fields
      teacherCode, specialization,
    } = req.body as Record<string, string>;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      await t.rollback();
      res.status(409).json({ success: false, error: 'El email ya está registrado' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role as 'admin' | 'teacher' | 'student', active: true }, { transaction: t });

    if (role === 'student') {
      await Student.create({
        userId: user.id,
        studentCode,
        birthDate,
        phone: phone || '',
        address: address || '',
        guardianName: guardianName || '',
        guardianPhone: guardianPhone || '',
      }, { transaction: t });
    } else if (role === 'teacher') {
      await Teacher.create({
        userId: user.id,
        teacherCode,
        specialization: specialization || '',
        phone: phone || '',
      }, { transaction: t });
    }

    await t.commit();

    const created = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Student, as: 'studentProfile' },
        { model: Teacher, as: 'teacherProfile' },
      ],
    });

    res.status(201).json({ success: true, data: created, message: 'Usuario creado correctamente' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: 'Error al crear usuario' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const { name, email, role, active, phone, address, guardianName, guardianPhone, birthDate, specialization } = req.body as Record<string, string | boolean>;

    if (name) user.name = name as string;
    if (email) user.email = email as string;
    if (active !== undefined) user.active = Boolean(active);
    await user.save({ transaction: t });

    if (user.role === 'student') {
      const profile = await Student.findOne({ where: { userId: user.id }, transaction: t });
      if (profile) {
        if (phone !== undefined) profile.phone = phone as string;
        if (address !== undefined) profile.address = address as string;
        if (guardianName !== undefined) profile.guardianName = guardianName as string;
        if (guardianPhone !== undefined) profile.guardianPhone = guardianPhone as string;
        if (birthDate !== undefined) profile.birthDate = birthDate as string;
        await profile.save({ transaction: t });
      }
    } else if (user.role === 'teacher') {
      const profile = await Teacher.findOne({ where: { userId: user.id }, transaction: t });
      if (profile) {
        if (phone !== undefined) profile.phone = phone as string;
        if (specialization !== undefined) profile.specialization = specialization as string;
        await profile.save({ transaction: t });
      }
    }

    await t.commit();

    const updated = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Student, as: 'studentProfile' },
        { model: Teacher, as: 'teacherProfile' },
      ],
    });

    res.json({ success: true, data: updated, message: 'Usuario actualizado' });
  } catch {
    await t.rollback();
    res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    // Soft delete
    user.active = false;
    await user.save();
    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al desactivar usuario' });
  }
};

export const activateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    user.active = true;
    await user.save();
    res.json({ success: true, message: 'Usuario activado correctamente' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al activar usuario' });
  }
};

export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    user.active = false;
    await user.save();
    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al desactivar usuario' });
  }
};

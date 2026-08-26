import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Student, Teacher } from '../models/index';
import { signToken } from '../config/jwt';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ where: { email, active: true } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      return;
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      message: 'Inicio de sesión exitoso',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await User.findByPk(userId, {
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

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ success: false, error: 'La contraseña actual es incorrecta' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

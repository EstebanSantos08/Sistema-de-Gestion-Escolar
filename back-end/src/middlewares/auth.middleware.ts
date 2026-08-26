import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token no proporcionado' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
};

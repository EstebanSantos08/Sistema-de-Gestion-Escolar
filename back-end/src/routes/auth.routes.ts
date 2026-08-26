import { Router } from 'express';
import { body } from 'express-validator';
import { login, me, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
    validate,
  ],
  login
);

router.get('/me', authenticate, me);

router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Mínimo 8 caracteres')
      .matches(/[A-Z]/)
      .withMessage('Debe tener al menos una mayúscula')
      .matches(/[0-9]/)
      .withMessage('Debe tener al menos un número'),
    body('confirmPassword').notEmpty().withMessage('Confirmación requerida'),
    validate,
  ],
  changePassword
);

export default router;

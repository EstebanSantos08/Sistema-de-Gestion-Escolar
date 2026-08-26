import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { getUsers, getUserById, createUser, updateUser, deleteUser, activateUser, deactivateUser } from '../controllers/user.controller';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/activate', activateUser);
router.patch('/:id/deactivate', deactivateUser);

export default router;

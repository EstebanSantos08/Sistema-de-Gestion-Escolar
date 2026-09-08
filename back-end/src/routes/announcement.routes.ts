import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
} from '../controllers/announcement.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.get('/:id', getAnnouncementById);
router.put('/:id', updateAnnouncement);

export default router;

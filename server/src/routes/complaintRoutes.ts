import { Router } from 'express';
import { ComplaintsController } from '../controllers/complaintsController';
import { authenticateJWT, optionalAuthJWT } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Live AI description assist & severity preview
router.post('/ai-assist', ComplaintsController.aiAssist);

// Citizen complaints
router.post('/', optionalAuthJWT, upload.array('files', 5), ComplaintsController.submitComplaint);
router.get('/my', authenticateJWT, ComplaintsController.getMyComplaints);
router.get('/:ticketId', ComplaintsController.getByTicketId);
router.post('/:id/followup', optionalAuthJWT, upload.array('files', 5), ComplaintsController.addFollowup);

export default router;

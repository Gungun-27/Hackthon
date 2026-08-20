import { Router } from 'express';
import { AuthorityController } from '../controllers/authorityController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Protect authority endpoints for officer & admin
router.use(authenticateJWT);
router.use(requireRole(['officer', 'admin']));

router.get('/complaints', AuthorityController.getComplaints);
router.get('/complaints/:id', AuthorityController.getComplaintDetail);
router.patch('/complaints/:id/status', AuthorityController.updateStatus);
router.patch('/complaints/:id/assign', AuthorityController.assign);
router.post('/complaints/:id/notes', AuthorityController.addInternalNote);
router.get('/departments-and-officers', AuthorityController.getDepartmentsAndOfficers);

export default router;

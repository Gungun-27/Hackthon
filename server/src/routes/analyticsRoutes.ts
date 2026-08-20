import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Summary & Heatmap endpoints (Allow open or officer access for command board)
router.get('/summary', AnalyticsController.getSummary);
router.get('/heatmap', AnalyticsController.getHeatmap);

export default router;

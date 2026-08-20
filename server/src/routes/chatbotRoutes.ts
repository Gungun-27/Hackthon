import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbotController';

const router = Router();

router.post('/message', ChatbotController.handleMessage);

export default router;

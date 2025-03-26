import { Router } from 'express';
import { createEmergency } from '../controllers/emergencyController.js';

const router = Router();

router.post('/', createEmergency);

export default router; 
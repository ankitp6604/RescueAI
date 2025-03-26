import express from 'express';
import {
  createDispatch,
  updateDispatchStatus,
  getDispatchById,
  getFacilityDispatches
} from '../controllers/dispatchController.js';

const router = express.Router();

router.post('/', createDispatch);
router.patch('/:id/status', updateDispatchStatus);
router.get('/:id', getDispatchById);
router.get('/facility/:facilityId', getFacilityDispatches);

export default router; 
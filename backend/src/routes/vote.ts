import express from 'express';
import { 
  submitAvailabilityController, 
  getTripHeatmapController, 
  startVotingController, 
  getTripDetailController, 
  updateBudgetController, 
  submitLocationVoteController,
  closeTripController, 
  getDateMatchingResultController
} from '../controllers/voteController.js';
import { auth } from '../middleware/auth.js';
import { requireTripOwner } from '../middleware/role.js';

const router = express.Router();

//============ TRIP =============

router.post('/:tripCode/close', auth, requireTripOwner, closeTripController);

// ============ DATE VOTING ============

router.post('/availability', auth, submitAvailabilityController);

router.get('/heatmap/:tripId', auth, getTripHeatmapController);

router.post('/start-date-voting', auth, requireTripOwner, startVotingController);

router.get('/:tripId/date-matching-result', auth, getDateMatchingResultController);

// ============ PLACE VOTING ============

router.post('/start-voting', auth, requireTripOwner, startVotingController);

router.get('/:tripCode', auth, getTripDetailController);

router.post('/:tripCode/vote-place', auth, submitLocationVoteController);

// ============ BUDGET VOTING ============

router.put('/:tripCode/budget', auth, updateBudgetController);





export default router;
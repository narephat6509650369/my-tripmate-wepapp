import express from 'express';
import { 
  submitAvailabilityController, 
  // getTripHeatmapController, 
  //startVotingController, 
  //getTripDetailController, 
  submitBudgetVoteController, 
  submitLocationVoteController,
  //closeTripController, 
  getDateMatchingResultController,
  getBudgetVoteController,
  getLocationVoteController
} from '../controllers/voteController.js';
import { auth } from '../middleware/auth.js';
import { requireTripOwner } from '../middleware/role.js';

const router = express.Router();

//============ TRIP =============

//router.post('/:tripCode/close', auth, requireTripOwner, closeTripController);

// ============ DATE VOTING ============

router.post('/availability', auth, submitAvailabilityController);

//router.get('/heatmap/:tripId', auth, getTripHeatmapController);

//router.post('/start-date-voting', auth, requireTripOwner, startVotingController);

router.get('/:tripId/date-matching-result', auth, getDateMatchingResultController);

// ============ PLACE VOTING ============

//router.post('/start-voting', auth, requireTripOwner, startVotingController);
router.get('/:tripId/get-vote-place', auth, getLocationVoteController);
router.post('/:tripId/vote-place', auth, submitLocationVoteController);

// ============ BUDGET VOTING ============

router.post('/:tripId/budget', auth, submitBudgetVoteController);
//router.get('/:tripcode/get-budget', auth, getTripDetailController);
router.get('/:tripId/get-budget', auth, getBudgetVoteController); // Temporarily disable trip detail fetching




export default router;
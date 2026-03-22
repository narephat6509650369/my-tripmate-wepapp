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

// ============ DATE VOTING ============
router.post('/availability', auth, submitAvailabilityController);
router.get('/:tripId/date-matching-result', auth, getDateMatchingResultController);

// ============ PLACE VOTING ============
router.get('/:tripId/get-vote-place', auth, getLocationVoteController) 
router.post('/:tripid/vote-place', auth, submitLocationVoteController);

// ============ BUDGET VOTING ============
router.post('/:tripId/budget', auth, submitBudgetVoteController);
router.get('/:tripId/get-budget', auth, getBudgetVoteController); // Temporarily disable trip detail fetching




export default router;
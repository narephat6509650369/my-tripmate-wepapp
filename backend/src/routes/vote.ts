import express from 'express';
import { 
  submitAvailabilityController, 
  getTripHeatmapController, 
  startVotingController, 
  getTripDetailController, 
  updateBudgetController, 
  submitLocationVoteController,
  closeTripController 
} from '../controllers/voteController.js';
import { auth } from '../middleware/auth.js';
import { requireTripOwner } from '../middleware/role.js';

const router = express.Router();

// ============ DATE VOTING ============

/**
 * POST /api/votes/availability
 * User กดส่งวันว่าง (ส่งมาเป็น Array หลายช่วงได้)
 * 
 * Request Body:
 * {
 *   "trip_id": "trip-uuid-1234",
 *   "ranges": [
 *     { "start_date": "2025-12-20", "end_date": "2025-12-22" },
 *     { "start_date": "2025-12-25", "end_date": "2025-12-26" }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Availability updated successfully"
 * }
 */
router.post('/availability', auth, submitAvailabilityController);

/**
 * GET /api/votes/heatmap/:tripId
 * Frontend ดึงข้อมูลไปวาดปฏิทิน
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "2025-12-20": ["user-id-001"],
 *     "2025-12-21": ["user-id-001", "user-id-002"],
 *     "2025-12-22": ["user-id-001", "user-id-002", "user-id-003"]
 *   }
 * }
 */
router.get('/heatmap/:tripId', auth, getTripHeatmapController);

/**
 * POST /api/votes/start-voting
 * Owner กดเปิดห้องโหวต + เปลี่ยนสถานะทริปเป็น 'voting'
 * 
 * Request Body:
 * {
 *   "trip_id": "b3f6a2c1-7e8d-4a9b-8c2d-1e4f5a6b7c8d"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "voting_id": "f8a9b2c3-1d4e-5f6a-7b8c-9d0e1f2a3b4c",
 *     "status": "active",
 *     "message": "Voting session started and trip status updated to 'voting'"
 *   }
 * }
 */
router.post('/start-voting', auth, requireTripOwner, startVotingController);

// ============ BUDGET & LOCATION ============

/**
 * GET /api/votes/:tripCode
 * ดึงข้อมูลทริปทั้งหมด (Step 2,3,4,5 ใช้ตัวนี้ตัวเดียวตอนโหลดหน้า)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "trip": {...},
 *     "members": [...],
 *     "budgets": [...],
 *     "budgetLogs": [...],
 *     "locationScores": [...],
 *     "availabilities": [...]
 *   }
 * }
 */
router.get('/:tripCode', auth, getTripDetailController);

/**
 * PUT /api/votes/:tripCode/budget
 * แก้งบประมาณ
 * 
 * Request Body:
 * {
 *   "category": "accommodation",
 *   "amount": 5000
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "อัปเดตงบประมาณสำเร็จ",
 *   "data": {
 *     "old_amount": 3000,
 *     "new_amount": 5000
 *   }
 * }
 */
router.put('/:tripCode/budget', auth, updateBudgetController);

/**
 * POST /api/votes/:tripCode/vote-place
 * โหวตสถานที่ (Ranked Voting: อันดับ 1-3)
 * 
 * Request Body:
 * {
 *   "votes": ["เชียงใหม่", "ภูเก็ต", "กระบี่"]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "scores": {
 *     "เชียงใหม่": 15,
 *     "ภูเก็ต": 10,
 *     "กระบี่": 8
 *   }
 * }
 */
router.post('/:tripCode/vote-place', auth, submitLocationVoteController);

/**
 * POST /api/votes/:tripCode/close
 * ปิดการโหวต (Owner only)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "ปิดการโหวตสำเร็จ ทริปพร้อมใช้งาน"
 * }
 */
router.post('/:tripCode/close', auth, requireTripOwner, closeTripController);

export default router;
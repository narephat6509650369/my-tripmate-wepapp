// src/routes/voteRoutes.ts
import express from 'express';
import { submitAvailabilityController, getTripHeatmapController, startDateVotingController, startVotingController } from '../controllers/voteController.js';
import { auth } from '../middleware/auth.js';
import { requireTripOwner } from '../middleware/role.js';

const router = express.Router();

// User กดส่งวันว่าง (ส่งมาเป็น Array หลายช่วงได้) 
/*

Request Body : 
{
  "trip_id": "trip-uuid-1234",
  "ranges": [
    {
      "start_date": "2025-12-20",
      "end_date": "2025-12-22"
    },
    {
      "start_date": "2025-12-25",
      "end_date": "2025-12-26"
    }
  ]
}
Response :
{
  "success": true,
  "message": "Availability updated successfully"
}
  */
router.post('/availability', auth, submitAvailabilityController);

// Frontend ดึงข้อมูลไปวาดปฏิทิน
/*
Request ไม่ต้องส่ง Body
Response:
{
  "success": true,
  "data": {
    "2025-12-20": [
      "user-id-001" 
    ],
    "2025-12-21": [
      "user-id-001",
      "user-id-002"
    ],
    "2025-12-22": [
      "user-id-001",
      "user-id-002",
      "user-id-003"
    ],
    "2025-12-25": [
      "user-id-001"
    ],
    "2025-12-26": [
      "user-id-001"
    ]
  }
}
*/
router.get('/heatmap/:tripId', auth, getTripHeatmapController);

// Owner กดเปิดห้องโหวต
/*
{
Request Body:
{
  "trip_id": "trip-uuid-1234"
}
Response:
  "success": true,
  "data": {
    "voting_id": "voting-uuid-9999",
    "status": "active"
  }
}
*/
router.post('/start', auth, startDateVotingController);

/*
Request:
{
  "trip_id": "b3f6a2c1-7e8d-4a9b-8c2d-1e4f5a6b7c8d"
}
Response :
{
  "success": true,
  "data": {
    "voting_id": "f8a9b2c3-1d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "status": "active",
    "message": "Voting session started and trip status updated to 'voting'"
  }
}
*/
router.post('/start', auth, requireTripOwner, startVotingController)

export default router;
import express from 'express';
import { addTripController, getMyTrips, getTripDetail, deleteTripController,joinTripByCode, removeMemberController} from "../controllers/TripController.js";
import { auth } from "../middleware/auth.js"
import { generateInviteCode } from '../models/tripModel.js';

const router = express.Router();

router.post('/AddTrip', auth, addTripController);
router.get('/GetTrip', (req, res) => {
    // Implementation for getting trips
    res.status(200).json({ message: "Trips retrieved successfully" });
});
router.put('/UpdateTrip', (req, res) => {
    // Implementation for updating a trip
    res.status(200).json({ message: "Trip updated successfully" });
});
router.delete('/DeleteTrip', auth, deleteTripController);

router.get("/my-trips", auth, getMyTrips);

router.get("/:tripId", auth, getTripDetail);

// เจ้าของทริปสร้างโค้ดเชิญ
router.post("/:tripId/invite", auth, generateInviteCode);

// ผู้ใช้ที่มีบัญชี join โดยใช้โค้ด
router.post("/join", auth, joinTripByCode);

// Owner ลบสมาชิกออกจากทริป  
router.delete("/:tripId/members/:memberId", auth, removeMemberController);

export default router;
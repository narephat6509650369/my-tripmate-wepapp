import express from 'express';
import { addTripController, getMyTripsController, deleteTripController,joinTripController, removeMemberController} from "../controllers/TripController.js";
import { auth } from "../middleware/auth.js"
import { requireTripOwner } from "../middleware/role.js"
import { generateInviteCode } from '../models/tripModel.js';

const router = express.Router();

router.post('/AddTrip', auth, addTripController);

router.delete('/DeleteTrip', auth, requireTripOwner,deleteTripController);

router.get("/all-my-trips", auth, getMyTripsController);

//router.get("/:tripId", auth, getTripDetail);

// เจ้าของทริปสร้างโค้ดเชิญ
router.post("/:tripId/invite", auth, generateInviteCode);

// ผู้ใช้ที่มีบัญชี join โดยใช้โค้ด
router.post("/join", auth, joinTripController);


// Owner ลบสมาชิกออกจากทริป  
router.delete("/:tripId/members/:memberId", auth, requireTripOwner, removeMemberController);

export default router;
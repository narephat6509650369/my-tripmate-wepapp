import express from 'express';
import { addTripController, getMyTripsController, getPendingRequestsController, approveMemberController, rejectMemberController, deleteTripController, removeMemberController, getTripDetailController, getTripSummaryController, manualCloseController,getMemberController,requestJoinTripController} from "../controllers/TripController.js";
import { auth } from "../middleware/auth.js"
import { requireTripOwner ,requireTripMember} from "../middleware/role.js"


const router = express.Router();


// ผู้ใช้ที่มีบัญชี join โดยใช้โค้ด
/* returns: { success: true, message: "เข้าร่วมทริปสำเร็จ", trip_id, trip_name } */
//router.post("/join", auth, joinTripController);

router.post("/request-join",auth,requestJoinTripController);

router.get("/:tripId/pending-requests",auth,getPendingRequestsController);

router.patch("/:tripId/approve/:userId",auth,approveMemberController);

router.patch("/:tripId/reject/:userId",auth,rejectMemberController);

//  ดึงสรุปผลทริป (สำหรับหน้า summary)
/* returns: { trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status } */
router.get("/:tripId/summary",auth,getTripSummaryController);

// ดึงทริปทั้งหมดของผู้ใช้(เจ้าของ + เข้าร่วม)*  
/* returns: { all, owned, joined } */
router.get("/all-my-trips", auth, getMyTripsController);

//เพิ่มทริปใหม่*

router.post('/add-trip', auth, addTripController);

// ลบทริป (เจ้าของทริปเท่านั้น)*
/* returns: { success: true, message: "ลบทริปสำเร็จ" } */
router.delete('/:tripId', auth, deleteTripController);

// ดึงรายละเอียดทริป
/* returns: { trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status } */
router.get("/:tripId", auth, getTripDetailController);

// Owner ลบสมาชิกออกจากทริป  
router.delete("/:tripId/members/:memberId", auth, removeMemberController);

// Owner ดึงสมาชิกจากทริป
router.get("/:tripId/get-members",auth,getMemberController);


// ปิดทริป
//router.patch("/:tripId/auto-close",auth,autoCloseController);
router.patch("/:tripId/manual-close",auth,requireTripOwner,manualCloseController);

export default router;
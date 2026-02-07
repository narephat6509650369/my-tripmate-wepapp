import express from 'express';
import { addTripController, getMyTripsController, deleteTripController,joinTripController, removeMemberController, getTripDetailController, getTripSummaryController} from "../controllers/TripController.js";
import { auth } from "../middleware/auth.js"
import { requireTripOwner ,requireTripMember} from "../middleware/role.js"


const router = express.Router();


// ผู้ใช้ที่มีบัญชี join โดยใช้โค้ด
/* returns: { success: true, message: "เข้าร่วมทริปสำเร็จ", trip_id, trip_name } */
router.post("/join", auth, joinTripController);

//  ดึงสรุปผลทริป (สำหรับหน้า summary)
/* returns: { trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status } */
router.get("/:tripId/summary",auth,getTripSummaryController);

// ดึงทริปทั้งหมดของผู้ใช้(เจ้าของ + เข้าร่วม)*  
/* returns: { all, owned, joined } */
router.get("/all-my-trips", auth, getMyTripsController);

//เพิ่มทริปใหม่*
/*
returns:
    trip_id,
    owner_id,
    trip_name,
    description,
    num_days,
    invite_code,
    invite_link,
    status: 'planning'
*/
router.post('/AddTrip', auth, addTripController);

// ลบทริป (เจ้าของทริปเท่านั้น)*
/* returns: { success: true, message: "ลบทริปสำเร็จ" } */
router.delete('/DeleteTrip', auth, requireTripOwner,deleteTripController);

// ดึงรายละเอียดทริป
/* returns: { trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status } */
router.get("/:tripId", auth, getTripDetailController);

// Owner ลบสมาชิกออกจากทริป  
/* returns: { success: true, message: "ลบสมาชิกสำเร็จ" } */
router.delete("/:tripId/members/:memberId", auth, requireTripOwner, removeMemberController);

// อัปเดตสถานะทริป
/*return { success: true, message: "อัปเดตสถานะทริปสำเร็จ" } */
//router.patch("/:tripId/status",auth,requireTripOwner,updateTripStatusController);

// อัปเดตงบประมาณสมาชิก
/* returns: { success: true, message: "อัปเดตงบประมาณสมาชิกสำเร็จ" } */
//router.patch("/:tripId/budget",auth,updateMemberBudgetController);




// owner ปิดทริป
/* returns: { success: true, message: "ปิดทริปสำเร็จ" } */
//router.patch("/:tripId/close",auth,requireTripOwner,updateTripStatusController);

export default router;
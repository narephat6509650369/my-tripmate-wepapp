import express from 'express';
import { getUnreadCountController, markNotificationAsReadController, getUserNotiController, markAllNotificationAsReadController,deleteNotificationController} from "../controllers/notiController.js";
import { auth } from "../middleware/auth.js"


const router = express.Router();
//ใช้ตอนหน้าNotification Page
router.get('/get-noti', auth, getUserNotiController);
//ใช้แสดงตอน Bell Icon มีกี่ noti ที่ยังไม่อ่าน
router.get('/unread-count', auth, getUnreadCountController);

//ผู้ใช้กด notification อันเดียว เพื่อทำการเช็คว่าอ่านแล้ว
router.patch('/:id/read', auth, markNotificationAsReadController);
//เผื่อเพิ่มปุ่ม read all ให้user ทำเครื่องหมายว่าอ่านทั้งหมด
router.patch('/read-all', auth, markAllNotificationAsReadController);

//ลบ noti ทั่วไป
router.delete('/notifications/:id',auth,deleteNotificationController)

export default router;
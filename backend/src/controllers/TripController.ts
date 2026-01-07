import type { Request, Response } from "express";
import { getUserTrips, joinTripByCode, removeMemberService, deleteTripService, addTrip, getTripDetail, findById, getTripSummaryService} from "../services/tripService.js";



//เพิ่มสมาชิก
export const addTripController = async (req: Request, res: Response) => {
  try{
    const { trip_name, description, num_days } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!trip_name || typeof trip_name !== 'string' || trip_name.trim() === '') {
      return res.status(400).json({ message: "Trip name is required and must be a string." });
    }
    if (!num_days || typeof num_days !== 'number' || num_days < 1) {
      return res.status(400).json({ message: "Number of days must be a number greater than 0." });
    }
    //call service
    const newTrip = await addTrip(userId, trip_name, description, num_days);

    res.status(201).json({ message: "Trip added successfully", trip: newTrip });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      message: "Failed to add trip",
      error: message
    });
  }
}

//ดึงข้อมูล trip ทั้ง trip ที่เป็นสมาชิกอยู่ทั้งหมด
export const getMyTripsController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // เรียก Service ตัวที่ถูกต้อง (ไม่ต้องมี fetch)
        const tripData = await getUserTrips(userId);

        return res.status(200).json({
            success: true,
            data: tripData // ส่ง object ที่มี { all, owned, joined } กลับไป
        });

    } catch (error) {
        console.error("getMyTrips error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

//delete trip โดย owner
export const deleteTripController = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.tripId;

    if (!tripId) {
      return res.status(400).json({ message: "tripId is required" });
    }

    await deleteTripService(tripId);

    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: "Failed to delete trip",
      error: message
    });
  }
}

//เข้าร่วมทริปด้วยโค้ด
export const joinTripController = async (req: Request, res: Response) => {
    try {
        const { invite_code } = req.body; // รับ code จาก body
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!invite_code) {
            return res.status(400).json({ message: "Invite code is required" });
        }

        // เรียก Service
        const result = await joinTripByCode(invite_code, userId);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        
        // จัดการ Error ตามกรณี
        if (message === "Invalid invite code") {
            return res.status(404).json({ message: "ไม่พบทริปที่ระบุ (รหัสไม่ถูกต้อง)" });
        }
        if (message.includes("already a member")) {
            return res.status(409).json({ message: "คุณเป็นสมาชิกของทริปนี้อยู่แล้ว" });
        }
        if (message.includes("closed")) {
             return res.status(403).json({ message: "ทริปนี้ปิดไปแล้ว ไม่สามารถเข้าร่วมได้" });
        }

        console.error("Join trip error:", error);
        res.status(500).json({ message: "Failed to join trip" });
    }
};

//ลบสมาชิกทริป
export const removeMemberController = async (req: Request, res: Response) => {
  try {
    const { trip_id, member_id } = req.params;
    const owner_id = req.user?.userId;

    if (!trip_id || !member_id) {
      return res.status(400).json({ message: "tripId and memberId are required" });
    }
    if(!owner_id){
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await removeMemberService({ trip_id, member_id, owner_id });

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    return res.status(200).json({ message: "Member removed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//api 
// ดึงรายละเอียดทริป แค่ทริปที่เป็นสมาชิกอยู่เท่านั้น
export const getTripDetailController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const userId = req.user?.userId; // จาก auth middleware

    if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

    if (!tripCode) {
      return res.status(400).json({
        success: false,
        message: 'tripCode is required'
      });
    }
    // ค้นหาทริปจาก tripCode
    const trip = await getTripDetail(tripCode);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบทริปนี้'
      });
    }

    // ตรวจสอบว่า user เป็นสมาชิกของทริปหรือไม่
    const isMember = trip.members.some((m: any) => m.userId.toString() === userId);
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงทริปนี้'
      });
    }

    return res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Get trip detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลทริป'
    });
  }
};

//อัปเดตสถานะทริป
export const updateTripStatusController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { isCompleted } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

    if(!tripId){
      return res.status(400).json({
        success: false,
        message: 'tripId is required'
      });
    }

    const trip = await findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบทริปนี้'
      });
    }

    // ตรวจสอบว่าเป็น owner หรือไม่
    if (trip.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขทริปนี้'
      });
    }

    trip.isCompleted = isCompleted;
    await trip.save();

    return res.status(200).json({
      success: true,
      message: 'อัปเดตสถานะทริปสำเร็จ',
      data: trip
    });
  } catch (error) {
    console.error('Update trip status error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
    });
  }
};

//  อัปเดตงบประมาณของสมาชิก
export const updateMemberBudgetController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { accommodation, transport, food } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
    }

    if(!tripId){
      return res.status(400).json({
        success: false,
        message: 'tripId is required'
      });
    }

    const trip = await findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบทริปนี้'
      });
    }

    // หาสมาชิกในทริป
    const memberIndex = trip.members.findIndex((m : any) => m.userId.toString() === userId);

    if (memberIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่ได้เป็นสมาชิกของทริปนี้'
      });
    }

    // อัปเดตงบประมาณ
    trip.members[memberIndex].budget = {
      accommodation: Number(accommodation) || 0,
      transport: Number(transport) || 0,
      food: Number(food) || 0
    };

    await trip.save();

    return res.status(200).json({
      success: true,
      message: 'อัปเดตงบประมาณสำเร็จ',
      data: trip
    });
  } catch (error) {
    console.error('Update budget error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตงบประมาณ'
    });
  }
};


// ดึวงสรุปผลทริป (สำหรับหน้า summary)
export const getTripSummaryController = async (req: Request,res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "tripId is required"
      });
    }
    
    const summary = await getTripSummaryService(tripId, userId);

    return res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error: any) {
    if (error.message === "Trip not found") {
      return res.status(404).json({
        success: false,
        message: "ไม่พบทริปนี้"
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์เข้าถึง summary ของทริปนี้"
      });
    }

    console.error("Get trip summary error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสรุปผลทริป"
    });
  }
};

export default {addTripController, deleteTripController, getMyTripsController, joinTripController, removeMemberController, getTripDetailController, updateTripStatusController, updateMemberBudgetController};

import type { Request, Response } from "express";
import { getUserTrips, joinTripByCode, removeMemberService, deleteTripService, addTrip, } from "../services/tripService.js";
import type { JwtPayload } from "../express.d.js"

//เพิ่มสมาชิก
export const addTripController = async (req: Request, res: Response) => {
  try{
    const { trip_name, description, num_days } = req.body;
    const user_id = (req.user as JwtPayload).user_id;
    if (!trip_name || typeof trip_name !== 'string' || trip_name.trim() === '') {
      return res.status(400).json({ message: "Trip name is required and must be a string." });
    }
    if (!num_days || typeof num_days !== 'number' || num_days < 1) {
      return res.status(400).json({ message: "Number of days must be a number greater than 0." });
    }
    const newTrip = await addTrip( user_id, trip_name, description, num_days );
    res.status(201).json({ message: "Trip added successfully", trip: newTrip });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      message: "Failed to add trip",
      error: message
    });
  }
}

//ดึงข้อมูล trip ทั้ง trip ที่ถูกเชิญและสร้างเอง
export const getMyTripsController = async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as JwtPayload).user_id;

        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // เรียก Service ตัวที่ถูกต้อง (ไม่ต้องมี fetch)
        const tripData = await getUserTrips(user_id);

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
        const user_id = (req.user as JwtPayload).user_id;

        if (!invite_code) {
            return res.status(400).json({ message: "Invite code is required" });
        }

        // เรียก Service
        const result = await joinTripByCode(invite_code, user_id);

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
    const owner_id = req.body.owner_id;

    if (!trip_id || !member_id) {
      return res.status(400).json({ message: "tripId and memberId are required" });
    }
    if(!owner_id){
      return res.status(400).json({ message: "OwnerId are required" });
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




export default {addTripController, deleteTripController, getMyTripsController, joinTripController, removeMemberController, };
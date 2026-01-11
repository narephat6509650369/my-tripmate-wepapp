import type { Request, Response } from "express";
import { getUserTrips, joinTripByCode, removeMemberService, deleteTripService, addTrip, getTripDetail, findById, getTripSummaryService} from "../services/tripService.js";



//เพิ่มสมาชิก
export const addTripController = async (req: Request, res: Response) => {
  try {
    const { trip_name, description, num_days } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized",
        error: { reason: "JWT token missing or invalid" }
      });
    }

    if (!trip_name) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "Trip name is required",
        error: { field: "trip_name" }
      });
    }

    if (!num_days || num_days < 1) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FIELD",
        message: "Number of days must be greater than 0",
        error: {
          field: "num_days",
          detail: num_days
        }
      });
    }

    const trip = await addTrip(userId, trip_name, description, num_days);

    return res.status(201).json({
      success: true,
      code: "TRIP_CREATED",
      message: "Trip created successfully",
      data: trip
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to create trip",
      error: {
        detail: err instanceof Error ? err.message : err
      }
    });
  }
};


//ดึงข้อมูล trip ทั้ง trip ที่เป็นสมาชิกอยู่ทั้งหมด
export const getMyTripsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const trips = await getUserTrips(userId);

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Trips retrieved successfully",
      data: trips
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to get trips",
      error: { detail: error }
    });
  }
};


//delete trip โดย owner
export const deleteTripController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    await deleteTripService(tripId);

    return res.status(200).json({
      success: true,
      code: "TRIP_DELETED",
      message: "Trip deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to delete trip",
      error: { detail: error }
    });
  }
};


//เข้าร่วมทริปด้วยโค้ด
export const joinTripController = async (req: Request, res: Response) => {
  try {
    const { invite_code } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!invite_code) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "Invite code is required",
        error: { field: "invite_code" }
      });
    }

    const result = await joinTripByCode(invite_code, userId);

    return res.status(200).json({
      success: true,
      code: "TRIP_JOINED",
      message: "Joined trip successfully",
      data: {
        tripId: result.trip_id,
        tripName: result.trip_name
      }
    });

  } catch (error: any) {
    let code = "INTERNAL_ERROR";
    let message = "Cannot join trip";

    if (error.message === "Invalid invite code") {
      code = "TRIP_NOT_FOUND";
      message = "ไม่พบห้อง (รหัสผิด)";
    }

    if (error.message.includes("already a member")) {
      code = "TRIP_ALREADY_MEMBER";
      message = "คุณเป็นสมาชิกอยู่แล้ว";
    }

    return res.status(400).json({
      success: false,
      code,
      message,
      error: { detail: error.message }
    });
  }
};



//ลบสมาชิกทริป
export const removeMemberController = async (req: Request, res: Response) => {
  try {
    const { trip_id, member_id } = req.params;
    const owner_id = req.user?.userId;

    if (!trip_id || !member_id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId and memberId are required",
        error: {
          field: !trip_id ? "trip_id" : "member_id"
        }
      });
    }

    if (!owner_id) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const result = await removeMemberService({ trip_id, member_id, owner_id });

    if (!result.success) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "Cannot remove member",
        error: {
          reason: result.error
        }
      });
    }

    return res.status(200).json({
      success: true,
      code: "TRIP_MEMBER_REMOVED",
      message: "Member removed successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to remove member",
      error: {
        detail: err instanceof Error ? err.message : err
      }
    });
  }
};

//api 
// ดึงรายละเอียดทริป แค่ทริปที่เป็นสมาชิกอยู่เท่านั้น
export const getTripDetailController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!tripCode) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripCode is required",
        error: { field: "tripCode" }
      });
    }

    const trip = await getTripDetail(tripCode);

    if (!trip) {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message: "ไม่พบทริปนี้"
      });
    }

    const isMember = trip.members.some(
      (m: any) => m.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "คุณไม่มีสิทธิ์เข้าถึงทริปนี้"
      });
    }

    return res.status(200).json({
      success: true,
      code: "TRIP_DETAIL_FETCHED",
      message: "Trip detail fetched successfully",
      data: trip
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to get trip detail",
      error: { detail: error }
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
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    const trip = await findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message: "ไม่พบทริปนี้"
      });
    }

    if (trip.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "คุณไม่มีสิทธิ์แก้ไขทริปนี้"
      });
    }

    trip.isCompleted = isCompleted;
    await trip.save();

    return res.status(200).json({
      success: true,
      code: "TRIP_STATUS_UPDATED",
      message: "อัปเดตสถานะทริปสำเร็จ",
      data: trip
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to update trip status",
      error: { detail: error }
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
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    const trip = await findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message: "ไม่พบทริปนี้"
      });
    }

    const memberIndex = trip.members.findIndex(
      (m: any) => m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "คุณไม่ได้เป็นสมาชิกของทริปนี้"
      });
    }

    trip.members[memberIndex].budget = {
      accommodation: Number(accommodation) || 0,
      transport: Number(transport) || 0,
      food: Number(food) || 0
    };

    await trip.save();

    return res.status(200).json({
      success: true,
      code: "TRIP_BUDGET_UPDATED",
      message: "อัปเดตงบประมาณสำเร็จ",
      data: trip
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to update budget",
      error: { detail: error }
    });
  }
};

// ดึวงสรุปผลทริป (สำหรับหน้า summary)
export const getTripSummaryController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    const summary = await getTripSummaryService(tripId, userId);

    return res.status(200).json({
      success: true,
      code: "TRIP_SUMMARY_FETCHED",
      message: "Trip summary fetched successfully",
      data: summary
    });

  } catch (error: any) {
    if (error.message === "Trip not found") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message: "ไม่พบทริปนี้"
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "คุณไม่มีสิทธิ์เข้าถึง summary ของทริปนี้"
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to get trip summary",
      error: { detail: error }
    });
  }
};


export default {addTripController, deleteTripController, getMyTripsController, joinTripController, removeMemberController, getTripDetailController, updateTripStatusController, updateMemberBudgetController};

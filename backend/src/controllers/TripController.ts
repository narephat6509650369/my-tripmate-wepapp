import type { Request, Response } from "express";
import { getUserTrips, joinTripByCode, removeMemberService, deleteTripService, addTrip, getTripDetail, getTripSummaryService, closeTripService, PromptTemplate, getMemberService} from "../services/tripService.js";
import voteService from "../services/voteService.js";

//เพิ่มสมาชิก
export const addTripController = async (req: Request, res: Response) => {
  try {
    const { trip_name, description, num_days } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) {
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

    const trip = await addTrip(user_id, trip_name, description, num_days);

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
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const trips = await getUserTrips(user_id);
    //console.log("User trips:", trips);

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
    const user_id = req.user?.user_id;

    if (!user_id) {
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

    const result = await joinTripByCode(invite_code, user_id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        code: "TRIP_JOIN_FAILED",
        message: result.message
      });
    }

    // extract จาก result.message
    const tripData = result.message as {
      trip_id: string;
      trip_name: string;
      rejoined: boolean;
      text: string;
    };

    return res.status(200).json({
      success: true,
      code: "TRIP_JOINED",
      message: tripData.text,
      data: {
        tripId: tripData.trip_id,
        tripName: tripData.trip_name,
        rejoined: tripData.rejoined
      }
    });

  } catch (error: any) {
    console.error("joinTripController error:", error);

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Cannot join trip"
    });
  }
};

//ลบสมาชิกทริป
export const removeMemberController = async (req: Request, res: Response) => {
  try {
    const { trip_id, member_id } = req.params;
    const owner_id = req.user?.user_id;

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

    const result = await removeMemberService(trip_id, member_id, owner_id);

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
    const { tripId } = req.params;
    const user_id = req.user?.user_id;

    if (!user_id) {
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

    const trip = await getTripDetail(tripId);
    //console.log("Trip detail:", trip);

    if (!trip) {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message: "ไม่พบทริปนี้"
      });
    }

    const isMember = trip.members?.some(
      (m: any) => m.id === user_id
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

// ดึวงสรุปผลทริป (สำหรับหน้า summary)

const allowedTemplates: PromptTemplate[] = [
  "comprehensive",
  "itinerary",
  "budget",
  "activities",
  "accommodation",
];

function parseTemplate(value: unknown): PromptTemplate {
  if (typeof value !== "string") return "comprehensive";

  return allowedTemplates.includes(value as PromptTemplate)
    ? (value as PromptTemplate)
    : "comprehensive";
}
export const getTripSummaryController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { template } = req.query;
    const user_id = req.user?.user_id;

    if (!user_id) {
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

    const selectedTemplate = parseTemplate(template);

    const summary = await getTripSummaryService(
      tripId,
      user_id,
      selectedTemplate
    );

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
    });
  }
};

/*
export const autoCloseController = async (req: Request, res: Response) => {
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

    const result = await closeTripService(tripId, "auto");

    if (!result || !result.success) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "Cannot close trip",
        error: {
          reason: result?.message || "Unknown error"
        }
      });
    }

    return res.status(200).json({
      success: true,
      code: "TRIP_CLOSED",
      message: "Trip closed successfully"
    });
  } catch (error) {
    console.error("Close trip error:", error instanceof Error ? error.message : error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to close trip",
      error: {
        detail: error instanceof Error ? error.message : error
      }
    });
}
};
*/

export const manualCloseController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const user_id = req.user?.user_id;
    if (!user_id) {
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

    const checkstatus = await voteService.checkTripStatus(tripId);
    
    if (checkstatus === "confirmed"|| checkstatus === "completed" || checkstatus === "archived") {
      return res.status(400).json({
          success: false,
          code: "TRIP_CLOSED",
          message: "This trip is already closed"
        });
    }

    const result = await closeTripService(tripId, "manual", user_id);

    if (!result || !result.success) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "Cannot close trip",
        error: {
          reason: result?.message || "Unknown error"
        }
      });
    }

    return res.status(200).json({
      success: true,
      code: "TRIP_CLOSED",
      message: "Trip closed successfully"
    });
  } catch (error) {
    console.error("Close trip error:", error instanceof Error ? error.message : error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to close trip",
      error: {
        detail: error instanceof Error ? error.message : error
      }
    });
}
};


export const deleteMemberController = async (req: Request, res: Response) => {
  try {
    const { tripId, memberId } = req.params;
    const ownerId = req.user?.user_id;

    //  1. ตรวจสอบ login
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 2. ตรวจสอบ parameter
    if (!tripId || !memberId) {
      return res.status(400).json({
        success: false,
        message: "Trip ID and Member ID are required"
      });
    }

    const result = await removeMemberService(tripId,ownerId,memberId);

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: result
    });

  } catch (error: any) {
    console.error("deleteMemberController error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to remove member"
    });
  }
};

export const getMemberController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const ownerId = req.user?.user_id;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "Trip ID is required"
      });
    }

    const result = await getMemberService(tripId, ownerId);

    // check success ก่อน
    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: result.message
      });
    }

    // ตอนนี้ TypeScript รู้ว่า result เป็น { success: true; data: TripMember[] }
    if (result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No members in this trip."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get Member from Owner success",
      data: result.data
    });

  } catch (error) {
    console.error("getMemberController error:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to find member"
    });
  }
};

export default {addTripController, deleteTripController, getMyTripsController, joinTripController, removeMemberController, getTripDetailController,getTripSummaryController, manualCloseController,deleteMemberController};

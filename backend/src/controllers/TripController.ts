import type { Request, Response } from "express";
import { getUserTrips, requestJoinTripByCode, removeMemberService, approveMember, deleteTripService, addTrip, getTripDetail, getTripSummaryService, closeTripService, PromptTemplate, getMemberService, getPendingRequests, rejectMember} from "../services/tripService.js";
import voteService from "../services/voteService.js";
import { findOwnerByTrip } from "../models/tripModel.js";
import { getIO, getUserSocket} from "../socket/socket.js";

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

    const response = await addTrip(user_id, trip_name, description, num_days);

    if (!response.success) {
      return res.status(500).json({
        success: false,
        code: "TRIP_CREATE_FAILED",
        message: response.message
      });
    }
    
    return res.status(201).json({
      success: true,
      code: "TRIP_CREATED",
      message: "Trip created successfully",
      data: response.data
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

    const response = await getUserTrips(user_id);
    //console.log("User trips:", response);

    if (!response.success) {
      return res.status(500).json({
        success: false,
        code: "GET_TRIPS_FAILED",
        message: response.message
      });
    }

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Trips retrieved successfully",
      data: response.data
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
    const user_id = req.user?.user_id;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    if (!user_id) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const checkOwner = await findOwnerByTrip(tripId);

    if (!checkOwner) {
      return res.status(404).json({
        success: false,
        message: "Trip not found"
      });
    }

    if (user_id !== checkOwner) {
      return res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์ลบทริปนี้"
      });
    }

    await deleteTripService(tripId,user_id);

    const io = getIO();
    io.to(`trip_${tripId}`).emit("trip_deleted", {
      trip_id: tripId,
    });

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
export const requestJoinTripController = async (req: Request,res: Response) => {

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
        code: "MISSING_INVITE_CODE",
        message: "Invite code is required"
      });
    }

    const result =await requestJoinTripByCode(invite_code,user_id);
    console.log("requestJoinTripController",result)
    const io = getIO();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        code: "REQUEST_FAILED",
        message: result.message
      });
    }

    //console.log("🔥 EMIT notification", {trip_id: result.trip_id,owner_id: result.owner_id});

    // หา socket ของ owner
    const ownerSocketId = getUserSocket(result.owner_id);

    //console.log("owner_id:", result.owner_id);
    //console.log("ownerSocketId:", ownerSocketId);

     // ส่งเฉพาะ owner
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("new_notification", {
        trip_id: result.trip_id,
        trip_name: result.trip_name,
        user_id: user_id,
        owner_id: result.owner_id
      });

      io.to(ownerSocketId).emit("member_updated", {
        tripId: result.trip_id
      });
    }


    return res.status(200).json({
      success: true,
      code: "REQUEST_SENT",
      message: result.message,
      data: {
        tripId: result.trip_id,
        tripName: result.trip_name
      }
    });

  } catch (error) {

    console.error(
      "requestJoinTripController error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Cannot request join trip"
    });

  }

};

export const getPendingRequestsController = async (req: Request,res: Response) => {

  try {

    const { tripId } = req.params;
    const user_id = req.user?.user_id;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result = await getPendingRequests(tripId, user_id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        code: "GET_PENDING_FAILED",
        message: result.message || "ไม่สามารถดึงคำขอเข้าร่วมทริปได้",
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("getPendingRequestsController error:",error);

    return res.status(500).json({
      success: false,
      message: "Cannot fetch pending requests"
    });

  }

};

export const approveMemberController = async (req: Request,res: Response) => {

  try {

    const { tripId, userId } = req.params;
    const owner_id = req.user?.user_id;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Member ID Require"
      });
    }

    if (!owner_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result = await approveMember(tripId,userId,owner_id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    const io = getIO();
    const memberSocketId = getUserSocket(userId);

    // แจ้ง member ที่ถูก approve
    if (memberSocketId) {
      io.to(memberSocketId).emit("new_notification", {
        trip_id: tripId
      });
    }
    console.log("emit member_updated", tripId);
    // แจ้งสมาชิกทุกคนใน trip
    io.to(`trip_${tripId}`).emit("member_updated", {
      tripId
    });

    return res.status(200).json({
      success: true,
      message: "Member approved successfully"
    });

  } catch (error) {

    console.error(
      "approveMemberController error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Cannot approve member"
    });

  }

};

export const rejectMemberController = async (req: Request,res: Response) => {

  try {

    const { tripId, userId } = req.params;
    const owner_id = req.user?.user_id;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" }
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!owner_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result = await rejectMember(tripId,userId,owner_id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    const io = getIO();
    const memberSocketId = getUserSocket(userId);
    if (memberSocketId) {
      io.to(memberSocketId).emit("join_rejected", {
        trip_id: tripId,
      });

      io.to(memberSocketId).emit("new_notification", {
        trip_id: tripId
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member rejected successfully"
    });

  } catch (error) {

    console.error(
      "rejectMemberController error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Cannot reject member"
    });

  }

};

/*
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
*/
//ลบสมาชิกทริป
export const removeMemberController = async (req: Request, res: Response) => {
  try {
    const { tripId, memberId } = req.params;
    const owner_id = req.user?.user_id;

    if (!tripId || !memberId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId and memberId are required",
        error: {
          field: !tripId ? "tripId" : "memberId"
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

    const result = await removeMemberService(tripId, memberId, owner_id);

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
    console.log("member id had been remove:",result.member_id)
    const io = getIO();
    const memberSocketId = getUserSocket(result.member_id);
    if (memberSocketId) {
      io.to(memberSocketId).emit("you_were_removed", {
        trip_id: tripId,
      });
      // แจ้ง notification
      io.to(memberSocketId).emit("new_notification", {
      trip_id: tripId
      });
    }

    //  แจ้งสมาชิกทุกคนใน trip
    io.to(`trip_${tripId}`).emit("new_notification", {
      trip_id: tripId,
      type: "member_removed"
    });

    io.to(`trip_${tripId}`).emit("member_updated", { tripId });
    io.to(`trip_${tripId}`).emit("vote_updated", { tripId });

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

    const response = await getTripDetail(tripId);
    //console.log("response:",response)
    //console.log("response:",response.data)

    if (!response.success) {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message: response.message
      });
    }

  const trip = response.data;

  const isMember = trip?.members?.some((m: any) => m.user_id === user_id) ?? false;

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

    const response = await getTripSummaryService(tripId,user_id,selectedTemplate);

    if (!response.success) {
      return res.status(404).json({
        success: false,
        code: "TRIP_SUMMARY_NOT_FOUND",
        message: "ไม่พบข้อมูลสรุปของทริปนี้"
      });
    }

    return res.status(200).json({
      success: true,
      code: "TRIP_SUMMARY_FETCHED",
      message: "Trip summary fetched successfully",
      data: response.data
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

    if (!result.success) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "Cannot close trip",
        error: {
          reason: result?.message || "Unknown error"
        }
      });
    }

    const io = getIO();

      io.to(`trip_${tripId}`).emit("trip_closed", {
        trip_id: tripId,
      });

    const ownerSocketId = getUserSocket(user_id);
      if (ownerSocketId) {
        io.to(ownerSocketId).emit("new_notification", {
          trip_id: tripId
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

/*
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

    const io = getIO();
    const memberSocketId = getUserSocket(memberId);
    if (memberSocketId) {
      io.to(memberSocketId).emit("join_rejected", {
        trip_id: tripId,
      });
      io.to(memberSocketId).emit("new_notification", {
          trip_id: tripId
      });
    }

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
*/

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
        message: result.message,
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


export default {addTripController, deleteTripController, getMyTripsController, requestJoinTripController, removeMemberController, getTripDetailController,getTripSummaryController, manualCloseController,getMemberController};
//deleteMemberController
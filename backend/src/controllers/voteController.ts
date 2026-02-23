import type { Request, Response } from 'express';
import * as voteService from '../services/voteService.js';
import type { JwtPayload } from '../express.d.js';
import { closeTripService } from '../services/tripService.js';

// ================= DATE VOTING =================
// post user ส่งวันว่างที่ตัวเองว่างมา
export const submitAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { trip_id, ranges } = req.body;
    const user_id = (req.user as JwtPayload)?.user_id;

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "trip_id is required",
        error: { field: "trip_id" }
      });
    }
    
    if(!Array.isArray(ranges) || ranges.some(date => typeof date !== 'string')) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FIELD",
        message: "ranges must be an array of date strings",
        error: { field: "ranges" }
      });
    }

    const checkstatus = await voteService.checkTripStatus(trip_id);

    if (checkstatus === "confirmed"|| checkstatus === "completed" || checkstatus === "archived") {
      return res.status(400).json({
        success: false,
        code: "TRIP_CLOSED",
        message: "Cannot vote on a closed trip"
      });
    }

    const result = await voteService.submitAvailability(trip_id, user_id, ranges);
    await closeTripService(trip_id, "auto");

    if (!result) {
      return res.status(500).json({
        success: false,
        code: "SUBMISSION_FAILED",
        message: "Failed to submit availability",
      });
    }
    return res.status(200).json({
      success: true,
      code: "AVAILABILITY_SUBMITTED",
      message: result.message,
      data: null
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to submit availability",
      error: {
        detail: err instanceof Error ? err.message : err
      }
    });
  }
};
/*
// ดึงข้อมูล heatmap ของทริป
export const getTripHeatmapController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "Trip ID is required",
        error: { field: "tripId" }
      });
    }

    const data = await voteService.getTripHeatmap(tripId, (req.user as JwtPayload)?.user_id);

    return res.status(200).json({
      success: true,
      code: "HEATMAP_LOADED",
      message: "Heatmap data loaded",
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to load heatmap",
      error: {
        detail: err instanceof Error ? err.message : err
      }
    });
  }
};
*/
/*
// เริ่มการโหวตเลือกวัน
export const startVotingController = async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.body;
    const user_id = (req.user as JwtPayload)?.user_id;

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "trip_id is required",
        error: { field: "trip_id" }
      });
    }

    const result = await voteService.startVotingSession(trip_id, user_id);

    return res.status(201).json({
      success: true,
      code: "VOTING_STARTED",
      message: "Voting session started",
      data: result
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message.includes("already active")) {
      return res.status(409).json({
        success: false,
        code: "VOTING_ALREADY_ACTIVE",
        message,
      });
    }

    if (message.includes("เฉพาะเจ้าของทริป")) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message,
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to start voting",
      error: { detail: message }
    });
  }
};
*/

// ดึงผลการ intersection ของวันว่างทั้งหมด
export const getDateMatchingResultController = async (req: Request, res: Response) => {
  try {
    const { tripId} = req.params;
    const user_id = (req.user as JwtPayload).user_id;
    
    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "Trip ID is required",
        error: { field: "tripId" }
      });
    }
    if (!user_id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "User ID is required",
        error: { field: "user_id" }
      });
    }

    const result = await voteService.getvoteDate(tripId, user_id);

    //console.log("Date matching:",result);

    //console.log("get tripmatching results:",result);

    return res.status(200).json({
      success: true,
      code: "DATE_MATCHING_RESULT",
      message: "Matching result loaded",
      data: result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to load date matching result",
      error: { detail: err instanceof Error ? err.message : err }
    });
  }
};


// ================= BUDGET  =================
/*
export const getTripDetailController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;

    if (!tripCode) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "Trip Code is required",
        error: { field: "tripCode" }
      });
    }

    const data = await voteService.getFullTripData(tripCode);

    return res.status(200).json({
      success: true,
      code: "TRIP_LOADED",
      message: "Trip data loaded",
      data
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "ไม่พบทริป") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to load trip",
      error: { detail: message }
    });
  }
};
*/
export const submitBudgetVoteController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { category, amount } = req.body;
    const user_id = (req.user as JwtPayload)?.user_id;

    if (!tripId || !category || amount === undefined) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId, category and amount are required"
      });
    }

    const checkstatus = await voteService.checkTripStatus(tripId);

    if (checkstatus === "confirmed"|| checkstatus === "completed" || checkstatus === "archived") {
      return res.status(400).json({
        success: false,
        code: "TRIP_CLOSED",
        message: "Cannot vote on a closed trip"
      });
    }

    const result = await voteService.updateBudget(tripId, user_id, category, amount);
    await closeTripService(tripId, "auto");

    return res.status(200).json({
      success: true,
      code: "BUDGET_UPDATED",
      message: result.message,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "ไม่พบทริป") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message
      });
    }

    if (message === "คุณไม่ได้เป็นสมาชิกของทริปนี้") {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to update budget",
      error: { detail: message }
    });
  }
};

export const getBudgetVoteController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const user_id = (req.user as JwtPayload)?.user_id;
    //console.log("BudgetVotingController ")
    //console.log("tripId:", tripId)
    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripCode is required",
        error: { field: "tripCode" }
      });
    }

    const data = await voteService.getvoteBudget(tripId, user_id);
    //console.log("budget vote:",data)

    return res.status(200).json({
      success: true,
      code: "BUDGET_VOTING_LOADED",
      message: "Budget voting data loaded",
      data
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "ไม่พบทริป") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message
      }); 
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to load budget voting",
      error: { detail: message }
    });
  }
};
//// ================= LOCATION =================

export const submitLocationVoteController = async (req: Request, res: Response) => {
  try {
    const { tripid } = req.params;
    const { votes } = req.body;
    const user_id = (req.user as JwtPayload)?.user_id;

    if (!Array.isArray(votes) || votes.length !== 3) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FIELD",
        message: "votes must be an array of 3 provinces",
        error: { field: "votes" }
      });
    }
    
    if (!tripid) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripid is required",
        error: { field: "tripid" }
      });
    }

    const checkstatus = await voteService.checkTripStatus(tripid);

    if (checkstatus === "confirmed"|| checkstatus === "completed" || checkstatus === "archived") {
      return res.status(400).json({
        success: false,
        code: "TRIP_CLOSED",
        message: "Cannot vote on a closed trip"
      });
    }
    
    const scores = await voteService.voteLocation(tripid, user_id, votes);
    await closeTripService(tripid, "auto");
    
    const data: Record<string, number> = {};
    scores.forEach((s: any) => {
      data[s.province_name] = Number(s.total_score);
    });

    return res.status(200).json({
      success: true,
      code: "LOCATION_VOTED",
      message: "Vote submitted successfully",
      data
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "ไม่พบทริป") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to submit vote",
      error: { detail: message }
    });
  }
};

export const getLocationVoteController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const user_id = (req.user as JwtPayload)?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "User not authenticated"
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

    const locationVotes = await voteService.getvoteLocation(tripId, user_id);

    return res.status(200).json({
      success: true,
      code: "LOCATION_VOTES_FETCHED",
      message: "Location votes fetched successfully",
      data: locationVotes
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    console.log("Error fetching location votes:", message);

    if (message === "ไม่พบทริป") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to fetch location votes",
      error: { detail: message }
    });
  }
};


/*
export const closeTripController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const user_id = (req.user as JwtPayload)?.user_id;

    if (!tripCode) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripCode is required",
        error: { field: "tripCode" }
      });
    }

    const result = await voteService.closeTrip(tripCode, user_id);

    return res.status(200).json({
      success: true,
      code: "TRIP_CLOSED",
      message: result.message
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "ไม่พบทริป") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message
      });
    }

    if (message.includes("เฉพาะเจ้าของทริป")) {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to close trip",
      error: { detail: message }
    });
  }
};
*/
import type { Request, Response } from 'express';
import * as voteService from '../services/voteService.js';
import type { JwtPayload } from '../express.d.js';

// ================= DATE VOTING =================

export const submitAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { trip_id, ranges } = req.body;
    const userId = (req.user as JwtPayload)?.userId;

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "trip_id is required",
        error: { field: "trip_id" }
      });
    }

    if (!Array.isArray(ranges) || ranges.length === 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FIELD",
        message: "ranges must be a non-empty array",
        error: { field: "ranges" }
      });
    }

    for (const range of ranges) {
      if (!range.start_date || !range.end_date) {
        return res.status(400).json({
          success: false,
          code: "INVALID_FIELD",
          message: "Each range must have start_date and end_date",
          error: { field: "ranges" }
        });
      }
    }

    const result = await voteService.submitAvailability(trip_id, userId, ranges);

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

    const data = await voteService.getTripHeatmap(tripId);

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

export const startVotingController = async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.body;
    const userId = (req.user as JwtPayload)?.userId;

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "trip_id is required",
        error: { field: "trip_id" }
      });
    }

    const result = await voteService.startVotingSession(trip_id, userId);

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

// ================= BUDGET & LOCATION =================

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

export const updateBudgetController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const { category, amount } = req.body;
    const userId = (req.user as JwtPayload)?.userId;

    if (!tripCode || !category || amount === undefined) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripCode, category and amount are required"
      });
    }

    const result = await voteService.updateBudget(tripCode, userId, category, amount);

    return res.status(200).json({
      success: true,
      code: "BUDGET_UPDATED",
      message: result.message,
      data: {
        old_amount: result.old_amount,
        new_amount: result.new_amount
      }
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

export const submitLocationVoteController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const { votes } = req.body;
    const userId = (req.user as JwtPayload)?.userId;

    if (!Array.isArray(votes) || votes.length !== 3) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FIELD",
        message: "votes must be an array of 3 provinces",
        error: { field: "votes" }
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

    const scores = await voteService.voteLocation(tripCode, userId, votes);

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

export const closeTripController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const userId = (req.user as JwtPayload)?.userId;

    if (!tripCode) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripCode is required",
        error: { field: "tripCode" }
      });
    }

    const result = await voteService.closeTrip(tripCode, userId);

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

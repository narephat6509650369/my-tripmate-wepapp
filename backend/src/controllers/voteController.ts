// backend/src/controllers/voteController.ts
import type { Request, Response } from 'express';
import * as voteService from '../services/voteService.js';
import type { JwtPayload } from '../express.d.js';

// ============ DATE VOTING ============

/**
 * POST /api/votes/availability
 * User ส่งวันว่าง (Array ของช่วงเวลา)
 */
export const submitAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { trip_id, ranges } = req.body;
    const userId = (req.user as JwtPayload).userId;

    // Validate input
    if (!trip_id || typeof trip_id !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: "trip_id is required" 
      });
    }

    if (!Array.isArray(ranges) || ranges.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "ranges must be a non-empty array" 
      });
    }

    // Validate each range
    for (const range of ranges) {
      if (!range.start_date || !range.end_date) {
        return res.status(400).json({ 
          success: false, 
          message: "Each range must have start_date and end_date" 
        });
      }
    }

    // Call service
    const result = await voteService.submitAvailability(trip_id, userId, ranges);

    res.status(200).json({ 
      success: true, 
      message: result.message 
    });
    
  } catch (error) {
    console.error("Submit availability error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ 
      success: false, 
      message: "Failed to submit availability", 
      error: message 
    });
  }
};

/**
 * GET /api/votes/heatmap/:tripId
 * ดึงกราฟวันว่าง
 */
export const getTripHeatmapController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({ 
        success: false, 
        message: "Trip ID is required" 
      });
    }

    const heatmapData = await voteService.getTripHeatmap(tripId);

    res.status(200).json({ 
      success: true, 
      data: heatmapData 
    });
    
  } catch (error) {
    console.error("Get heatmap error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ 
      success: false, 
      message: "Failed to get heatmap data",
      error: message 
    });
  }
};

/**
 * POST /api/votes/start
 * เริ่มเปิดโหวต (Owner only)
 */
export const startVotingController = async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.body;
    const userId = (req.user as JwtPayload).userId;

    if (!trip_id) {
      return res.status(400).json({ 
        success: false, 
        message: "trip_id is required" 
      });
    }

    // Call service
    const result = await voteService.startVotingSession(trip_id, userId);

    res.status(201).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error("Start voting error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Handle specific errors
    if (errorMessage.includes("already active")) {
      return res.status(409).json({ 
        success: false, 
        message: errorMessage 
      });
    }
    
    if (errorMessage.includes("เฉพาะเจ้าของทริป")) {
      return res.status(403).json({ 
        success: false, 
        message: errorMessage 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Failed to start voting session",
      error: errorMessage 
    });
  }
};

// ============ BUDGET & LOCATION ============

/**
 * GET /api/votes/:tripCode
 * ดึงข้อมูลทริปทั้งหมด (Load ครั้งแรก)
 */
export const getTripDetailController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;

    if (!tripCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Trip Code is required" 
      });
    }

    const data = await voteService.getFullTripData(tripCode);

    res.status(200).json({ 
      success: true, 
      data 
    });
    
  } catch (error) {
    console.error("Get trip detail error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message === "ไม่พบทริป") {
      return res.status(404).json({ 
        success: false, 
        message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error loading trip data",
      error: message 
    });
  }
};

/**
 * PUT /api/votes/:tripCode/budget
 * แก้งบประมาณ
 */
export const updateBudgetController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const { category, amount } = req.body;
    const userId = (req.user as JwtPayload).userId;

    // Validate
    if (!tripCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Trip Code is required" 
      });
    }

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: "category is required and must be a string" 
      });
    }

    if (amount === undefined || typeof amount !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: "amount is required and must be a number" 
      });
    }

    // Call service
    const result = await voteService.updateBudget(tripCode, userId, category, amount);

    res.status(200).json({ 
      success: true, 
      message: result.message,
      data: {
        old_amount: result.old_amount,
        new_amount: result.new_amount
      }
    });
    
  } catch (error) {
    console.error("Update budget error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message === "ไม่พบทริป") {
      return res.status(404).json({ success: false, message });
    }
    
    if (message === "คุณไม่ได้เป็นสมาชิกของทริปนี้") {
      return res.status(403).json({ success: false, message });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to update budget",
      error: message 
    });
  }
};

/**
 * POST /api/votes/:tripCode/vote-place
 * โหวตจังหวัด (Ranked Voting)
 */
export const submitLocationVoteController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const { votes } = req.body; // ["Phuket", "Krabi", "Trang"]
    const userId = (req.user as JwtPayload).userId;

    // Validate
    if (!tripCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Trip Code is required" 
      });
    }

    if (!Array.isArray(votes) || votes.length !== 3) {
      return res.status(400).json({ 
        success: false, 
        message: "votes must be an array of 3 provinces" 
      });
    }

    // Call service
    const newScores = await voteService.voteLocation(tripCode, userId, votes);

    // แปลง format ให้ตรงกับที่ frontend ต้องการ
    const scoreObj: Record<string, number> = {};
    newScores.forEach((s: any) => {
      scoreObj[s.province_name] = Number(s.total_score);
    });

    res.status(200).json({ 
      success: true, 
      scores: scoreObj 
    });
    
  } catch (error) {
    console.error("Submit location vote error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message.includes("ต้องเลือก") || message.includes("ต่างกัน")) {
      return res.status(400).json({ success: false, message });
    }
    
    if (message === "ไม่พบทริป") {
      return res.status(404).json({ success: false, message });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to submit vote",
      error: message 
    });
  }
};

/**
 * POST /api/votes/:tripCode/close
 * ปิดการโหวต (Owner only)
 */
export const closeTripController = async (req: Request, res: Response) => {
  try {
    const { tripCode } = req.params;
    const userId = (req.user as JwtPayload).userId;

    if (!tripCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Trip Code is required" 
      });
    }

    // Call service
    const result = await voteService.closeTrip(tripCode, userId);

    res.status(200).json({ 
      success: true, 
      message: result.message 
    });
    
  } catch (error) {
    console.error("Close trip error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message === "ไม่พบทริป") {
      return res.status(404).json({ success: false, message });
    }
    
    if (message.includes("เฉพาะเจ้าของทริป")) {
      return res.status(403).json({ success: false, message });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to close trip",
      error: message 
    });
  }
};

export default {
  submitAvailabilityController,
  getTripHeatmapController,
  startVotingController,
  getTripDetailController,
  updateBudgetController,
  submitLocationVoteController,
  closeTripController
};
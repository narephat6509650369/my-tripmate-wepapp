import type { Request, Response } from 'express';
import * as voteService from '../services/voteService.js';
import type { JwtPayload } from 'jsonwebtoken'; // ปรับตาม Auth middleware ของคุณ
 // ปรับตาม Auth middleware ของคุณ

// 1. Controller: User ส่งวันว่าง (POST)
export const submitAvailabilityController = async (req: Request, res: Response) => {
    try {
        const { trip_id, ranges } = req.body; // ranges ควรเป็น Array ของ {start_date, end_date}
        const user_id = (req.user as JwtPayload).user_id;

        if (!trip_id || !Array.isArray(ranges)) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        await voteService.submitAvailability(trip_id, user_id, ranges);

        res.status(200).json({ success: true, message: "Availability saved" });
    } catch (error) {
        console.error("Submit availability error:", error);
        res.status(500).json({ message: "Failed to submit availability" });
    }
};

// 2. Controller: ดึงกราฟวันว่าง (GET)
export const getTripHeatmapController = async (req: Request, res: Response) => {
    try {
        const { tripId } = req.params; // รับจาก URL params

        if (!tripId) {
            return res.status(400).json({ message: "Trip ID is required" });
        }

        const heatmapData = await voteService.getTripHeatmap(tripId);

        res.status(200).json({ 
            success: true, 
            data: heatmapData 
        });
    } catch (error) {
        console.error("Get heatmap error:", error);
        res.status(500).json({ message: "Failed to get heatmap data" });
    }
};

// 3. Controller: เริ่มเปิดโหวต (POST) - เฉพาะ Owner หรือ Admin
export const startDateVotingController = async (req: Request, res: Response) => {
    try {
        const { trip_id } = req.body;
        // ตรงนี้ควรมี Middleware เช็คว่าเป็น Owner ของทริปด้วย (ตามที่คุยกันก่อนหน้า)

        const result = await voteService.startDateVotingSession(trip_id);
        
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ message: "Failed to start voting session" });
    }
}

export const startVotingController = async (req: Request, res: Response) => {
    try {
        // รับ trip_id จาก Body
        const { trip_id } = req.body;
        
        // รับ user_id จาก Token (เอาไว้เช็คสิทธิ์ หรือ Log)
        const user_id = (req.user as JwtPayload).user_id;

        if (!trip_id) {
            return res.status(400).json({ message: "trip_id is required" });
        }

        // เรียก Service
        const result = await voteService.startVotingSession(trip_id, user_id);

        // ตอบกลับ 201 Created
        res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Start voting error:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // กรณีที่เปิดห้องโหวตซ้ำ ให้ตอบ 409 Conflict
        if (errorMessage.includes("already active")) {
            return res.status(409).json({ message: errorMessage });
        }

        res.status(500).json({ message: "Failed to start voting session" });
    }
}
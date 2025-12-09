import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js'; // หรือ path ที่คุณ connect database
import type { RowDataPacket } from 'mysql2';

interface UserRoleResult extends RowDataPacket {
    role: string;
}

// 1. ด่านตรวจ: "คุณต้องเป็นเจ้าของทริปเท่านั้น"
export const requireTripOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tripId = req.params.tripId || req.body.trip_id; // รับค่าได้ทั้งจาก URL หรือ Body
        const userId = (req.user as any).user_id; // ได้มาจาก verifyToken middleware ก่อนหน้านี้

        if (!tripId) return res.status(400).json({ message: "Trip ID is required" });

        // เช็คใน DB ว่า user คนนี้ เป็น owner ของ trip นี้จริงไหม
        const [rows] = await pool.query<UserRoleResult[]>(
            'SELECT role FROM trip_members WHERE trip_id = ? AND user_id = ? AND is_active = 1',
            [tripId, userId]
        );

        if (rows.length === 0 || rows[0]?.role !== 'owner') {
            return res.status(403).json({ message: "Access denied. Only trip owner can perform this action." });
        }

        // ถ้าผ่าน ให้ไปต่อ
        next(); 

    } catch (error) {
        console.error("Owner check error:", error);
        res.status(500).json({ message: "Internal server error during authorization" });
    }
};

// 2. ด่านตรวจ: "คุณต้องเป็นสมาชิกในทริป (Owner หรือ Member ก็ได้)"
export const requireTripMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tripId = req.params.tripId || req.body.trip_id;
        const userId = (req.user as any).user_id;

        const [rows] = await pool.query<UserRoleResult[]>(
            'SELECT role FROM trip_members WHERE trip_id = ? AND user_id = ? AND is_active = 1',
            [tripId, userId]
        );

        // ขอแค่เจอข้อมูล แปลว่าเป็นสมาชิก (ไม่สน role)
        if (rows.length === 0) {
            return res.status(403).json({ message: "Access denied. You are not a member of this trip." });
        }

        next();

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
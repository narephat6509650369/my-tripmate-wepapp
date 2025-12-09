import { v4 as uuidv4 } from 'uuid';
import * as voteModel from '../models/voteModel.js'; // Import Model ที่คุณให้มา
import { pool } from '../config/db.js'

export interface DateRange {
    start_date: string; // Format: 'YYYY-MM-DD'
    end_date: string;   // Format: 'YYYY-MM-DD'
}

export interface HeatmapData {
    [date: string]: string[]; // Key="2025-12-25", Value=["user_id_1", "user_id_2"]
}

// 1. Service สำหรับ User ส่งวันว่างเข้ามา
export const submitAvailability = async (trip_id: string, user_id: string, ranges: DateRange[]) => {
    // Step 1: ลบวันว่างเก่าของ User คนนี้ในทริปนี้ทิ้งทั้งหมดก่อน 
    // (เทคนิคนี้เรียกว่า "Replace Logic" ทำให้ไม่ต้องมานั่งเช็คว่าอันไหนแก้ อันไหนลบ)
    await voteModel.clearUserAvailability(trip_id, user_id);

    // Step 2: วน Loop บันทึกช่วงเวลาใหม่ทีละอัน
    // (ใช้ Promise.all เพื่อให้ทำงาน Parallel เร็วขึ้น)
    const insertPromises = ranges.map(range => {
        // Validation: วันเริ่มต้องไม่มากกว่าวันจบ
        if (new Date(range.start_date) > new Date(range.end_date)) {
            throw new Error(`Invalid date range: ${range.start_date} to ${range.end_date}`);
        }
        return voteModel.addAvailability(trip_id, user_id, range.start_date, range.end_date);
    });

    await Promise.all(insertPromises);
    
    return { message: "Availability updated successfully" };
};

// 2. Service สำหรับดึงข้อมูลไปทำกราฟ (Heatmap)
export const getTripHeatmap = async (trip_id: string) => {
    // Step 1: ดึงข้อมูลดิบจาก Database (Start - End)
    const rawData = await voteModel.getTripAvailabilities(trip_id);

    // Step 2: คำนวณ Logic แปลง Range เป็นรายวัน (Heatmap)
    const heatmap: HeatmapData = {};

    rawData.forEach((entry: any) => {
        let current = new Date(entry.start_date);
        const end = new Date(entry.end_date);

        // วน Loop ทุกวันในช่วงเวลานั้น
        while (current <= end) {
            const dateStr = current.toISOString().slice(0, 10); // "2023-12-25"

            if (!heatmap[dateStr]) {
                heatmap[dateStr] = [];
            }

            // ถ้า User คนนี้ยังไม่มีชื่อในวันนั้น ให้ใส่เข้าไป
            if (!heatmap[dateStr].includes(entry.user_id)) {
                heatmap[dateStr].push(entry.user_id);
            }

            // บวกวันเพิ่ม
            current.setDate(current.getDate() + 1);
        }
    });

    return heatmap; 
    // Return Object ที่ Frontend เอาไปใช้ง่ายๆ:
    // { "2023-12-25": ["userA", "userB"], "2023-12-26": ["userA"] }
};

// 3. Service เริ่มต้นการโหวต (สร้าง Session)
export const startDateVotingSession = async (trip_id: string) => {
    // เช็คก่อนว่ามีห้องโหวตอยู่แล้วหรือยัง (Optional)
    // ...
    
    const voting_id = uuidv4();
    await voteModel.insertDateVoting(voting_id, trip_id);
    return { voting_id, status: 'active' };
}

export const startVotingSession = async (trip_id: string, user_id: string) => {
    
    // 1. เช็คก่อนว่าทริปนี้มีห้องโหวตที่ Active อยู่แล้วไหม?
    const existingSession = await voteModel.getActiveDateVotingByTrip(trip_id);
    if (existingSession) {
        throw new Error("A voting session is already active for this trip.");
    }

    // 2. สร้าง ID ใหม่
    const date_voting_id = uuidv4();

    // 3. เริ่ม Transaction (เพราะเราจะทำ 2 อย่างพร้อมกัน: สร้างห้องโหวต + อัปเดตสถานะทริป)
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 3.1 Insert ลงตาราง date_votings (ใช้ Query จาก Model เดิม แต่เรียกผ่าน connection นี้)
        // หมายเหตุ: Model เดิมของคุณใช้ `pool.query` ตรงๆ ถ้าจะทำ Transaction สมบูรณ์แบบ 
        // ควรแก้ Model ให้รับ connection ได้ แต่เพื่อความง่าย ผมจะเขียนแยกตรงนี้ให้เห็นภาพครับ
        
        await connection.query(
            `INSERT INTO date_votings (date_voting_id, trip_id, status) VALUES (?, ?, 'active')`,
            [date_voting_id, trip_id]
        );

        // 3.2 อัปเดตสถานะทริปให้เป็น 'voting'
        await connection.query(
            `UPDATE trips SET status = 'voting' WHERE trip_id = ?`,
            [trip_id]
        );

        await connection.commit();
        
        return { 
            voting_id: date_voting_id, 
            status: 'active',
            message: "Voting session started and trip status updated to 'voting'"
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
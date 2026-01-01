import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface Trip {
    trip_id: string;
    owner_id: string;
    trip_name: string;
    description?: string | null;
    num_days: number;
    invite_code: string;
    invite_link: string;
    status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived';
    created_at?: Date;
    updated_at?: Date;
    confirmed_at?: Date | null;
    is_active?: boolean;
}

export interface TripMember extends RowDataPacket{
    member_id: string;
    trip_id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at?: Date;
    is_active?: boolean;
}

export interface TripDashboardItem {
    trip_id: string;
    trip_name: string;
    status: string;        // planning, voting, etc.
    role: 'owner' | 'member';
    num_members: number;   // จำนวนคนในทริป
    days_left: number;     // (Optional) เหลืออีกกี่วันจะถึงวันไป
    created_at: Date;
}

export interface TripSummary extends RowDataPacket {
    trip_id: string;
    trip_name: string;
    status: string;
    role: 'owner' | 'member'; // สำคัญมาก เอาไว้แยก Tab หน้าบ้าน
    num_members: number;
}

export interface MyTrip {
    trip_id: string;
    trip_name: string;
    owner_id: string;
    status: string;
    created_at: Date;
    num_members: number;
    days_left_7: number;
}


export interface TripDetail extends RowDataPacket {
    trip_id: string;
    owner_id: string;
    trip_name: string;
    description: string | null;
    num_days: number;
    invite_code: string;
    invite_link: string;
    status: string;
    created_at: Date;
    member_count: number;
}

export async function createTripWithMember( tripData: Trip, member_id: string ): Promise<void> {
    const connection = await pool.getConnection(); // ขอ Connection แยกมาเพื่อทำ Transaction

    try {
        await connection.beginTransaction(); // เริ่มต้น Transaction

        // 1. สร้าง Trip
        await connection.query(
            'INSERT INTO trips (trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                tripData.trip_id, 
                tripData.owner_id, 
                tripData.trip_name, 
                tripData.description, 
                tripData.num_days, 
                tripData.invite_code, 
                tripData.invite_link, 
                tripData.status
            ]
        );

        // 2. สร้าง Member (Owner)
        // Hardcode role='owner' และ is_active=1 ได้เลย เพราะฟังก์ชันนี้ใช้ตอนสร้างทริปใหม่เท่านั้น
        await connection.query(
            'INSERT INTO trip_members (member_id, trip_id, user_id, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [member_id, tripData.trip_id, tripData.owner_id, 'owner', 1]
        );

        await connection.commit(); // บันทึกจริงเมื่อผ่านทั้งคู่
    } catch (error) {
        await connection.rollback(); // ย้อนกลับถ้ามีอะไรพัง
        throw error; // ส่ง error กลับไปให้ Controller
    } finally {
        connection.release(); // คืน Connection เสมอ
    }
}

export async function findAllTripsByUserId(user_id: string): Promise<TripSummary[]> {
    // Query นี้จะ Join ตาราง trips กับ trip_members
    // เพื่อหาทุกทริปที่ user_id นี้มีชื่ออยู่ในสมาชิก
    const sql = `
        SELECT 
            t.trip_id, 
            t.trip_name, 
            t.status, 
            tm.role,
            (SELECT COUNT(*) FROM trip_members WHERE trip_id = t.trip_id AND is_active = 1) as num_members
        FROM trips t
        JOIN trip_members tm ON t.trip_id = tm.trip_id
        WHERE tm.user_id = ? AND tm.is_active = 1
        ORDER BY t.created_at DESC
    `;
    
    const [rows] = await pool.query<TripSummary[]>(sql, [user_id]);
    return rows;
}

// ฟังก์ชันดึงเฉพาะสถานะของทริป (ใช้เช็คก่อนลบ)
export const getTripStatus = async (trip_id: string): Promise<string | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT status FROM trips WHERE trip_id = ?',
    [trip_id]
  );
  
  return rows.length > 0 ? rows[0]?.status : null;
};

export async function deleteTrip(tripId: string): Promise<void> {
    await pool.query('DELETE FROM trips WHERE trip_id = ? AND owner_id = ?', [tripId]);
}   

export async function generateInviteCode(): Promise<string> {
    let code = '';
    let isUnique = false;

    // วนลูปจนกว่าจะได้รหัสที่ไม่ซ้ำใน Database
    while (!isUnique) {
        // 1. สร้างรหัส 16 ตัวอักษร (8 bytes แปลงเป็น hex จะได้ 16 ตัว)
        code = crypto.randomBytes(8).toString('hex').toUpperCase(); 
        
        // หรือถ้าอยากได้ตัวอักษรผสมตัวเลขแบบสุ่มเอง (Custom Set) ให้ใช้ฟังก์ชันแถมด้านล่าง *

        // 2. เช็คใน Database ว่าซ้ำไหม
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT trip_id FROM trips WHERE invite_code = ?', 
            [code]
        );

        // ถ้าไม่เจอ (rows.length === 0) แสดงว่าไม่ซ้ำ -> จบลูป
        if (rows.length === 0) {
            isUnique = true;
        }
    }

    return code;
}

export async function generateInviteLink(tripId: string): Promise<string> {
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/join/${tripId}`;
}


export const findTripById = async (tripId: string) => {
  const [rows] = await pool.execute("SELECT * FROM trips WHERE trip_id = ?", [tripId]);
  return (rows as any[])[0];
};

export const updateInviteInfo = async (tripId: string, inviteCode: string, inviteLink: string) => {
  await pool.execute(
    `UPDATE trips SET invite_code = ?, invite_link = ? WHERE trip_id = ?`,
    [inviteCode, inviteLink, tripId]
  );
};

export const findTripByInviteCode = async (inviteCode: string) => {
  const [rows] = await pool.execute(
    "SELECT * FROM trips WHERE invite_code = ?",
    [inviteCode]
  );
  return (rows as any[])[0];
};

export const addMemberIfNotExists = async (tripId: string, userId: string) => {
  const [rows] = await pool.execute(
    "SELECT * FROM tripmember WHERE trip_id = ? AND user_id = ?",
    [tripId, userId]
  );

  if ((rows as any[]).length > 0) return (rows as any[])[0];

  const role = "member";
  await pool.execute(
    `INSERT INTO tripmember (member_id, trip_id, user_id, role) VALUES (UUID(), ?, ?, ?)`,
    [tripId, userId, role]
  );

  return { trip_id: tripId, user_id: userId, role };
};

//รายการทริปทั้งหมดที่ user เข้าร่วม + ถูกเชิญ + เป็นเจ้าของ
export async function getMyTrips(userId: string): Promise<MyTrip[]> {
    const sql = `
        SELECT 
            t.trip_id,
            t.trip_name,
            t.owner_id,
            t.status,
            t.created_at,
            COUNT(tm2.user_id) AS num_members,
            DATEDIFF(t.created_at + INTERVAL 7 DAY, NOW()) AS days_left_7
        FROM trips t
        JOIN trip_members tm ON tm.trip_id = t.trip_id
        LEFT JOIN trip_members tm2 ON tm2.trip_id = t.trip_id AND tm2.is_active = TRUE
        WHERE tm.user_id = ? 
          AND t.is_active = TRUE
        GROUP BY t.trip_id
        ORDER BY t.created_at DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [userId]);

    return rows as MyTrip[];   
}

//ข้อมูลทริปแบบละเอียดของทริปหนึ่ง
export async function getTripDetail(tripId: string): Promise<TripDetail | null> {
    const sql = `
        SELECT 
            t.trip_id,
            t.owner_id,
            t.trip_name,
            t.description,
            t.num_days,
            t.invite_code,
            t.invite_link,
            t.status,
            t.created_at,
            COUNT(tm.user_id) AS member_count
        FROM trips t
        LEFT JOIN trip_members tm 
            ON t.trip_id = tm.trip_id AND tm.is_active = TRUE
        WHERE t.trip_id = ?
        GROUP BY t.trip_id
    `;

    const [rows] = await pool.query<TripDetail[]>(sql, [tripId]);

    if (rows.length === 0) return null;

    return rows[0] || null;  // ✔ ไม่ต้อง || null
}

// หาสมาชิกในทริป
export const findMemberInTrip = async (trip_id: string, member_id: string) => {
  const [rows] = await pool.query<TripMember[]>(
    `SELECT * FROM trip_members WHERE trip_id = ? AND member_id = ? AND is_active = 1`,
    [trip_id, member_id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getTripMembers = async (trip_id: string) => {
  const [rows] = await pool.query<TripMember[]>(
    `SELECT * FROM trip_members WHERE trip_id = ? AND is_active = 1`,
    [trip_id]
  );
  return rows;
}
// สมาชิกที่ออกจากทริปต้องไม่สามารถเข้าถึงข้อมูลโหวต/งบ/สถานที่ได้อีก
export const removeMemberById = async (trip_id: string, member_id: string) => {
  const connection = await pool.getConnection(); // ขอ Connection แยกเพื่อทำ Transaction
  
  try {
    await connection.beginTransaction(); // เริ่มต้น Transaction

    // 1. หา user_id จาก member_id ก่อน (เพราะตาราง availability ใช้ user_id)
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT user_id FROM trip_members WHERE member_id = ? AND trip_id = ?`,
      [member_id, trip_id]
    );

    if (rows.length === 0) {
       throw new Error("Member not found");
    }
    const user_id = rows[0]?.user_id;

    // 2. Soft Delete สมาชิก (Active = 0)
    await connection.query(
      `UPDATE trip_members SET is_active = 0 WHERE trip_id = ? AND member_id = ?`,
      [trip_id, member_id]
    );

    // 3. ลบ Availability (ใช้ user_id ที่หามาได้จากข้อ 1)
    await connection.query(
       `DELETE FROM trip_user_availabilities WHERE trip_id = ? AND user_id = ?`,
       [trip_id, user_id]
    );

    await connection.commit(); // บันทึกทุกอย่าง
    return { success: true, message: "Member removed and availability cleared" };

  } catch (error) {
    await connection.rollback(); // ถ้าพัง ให้ยกเลิกทั้งหมด (Data จะไม่แหว่ง)
    throw error;
  } finally {
    connection.release(); // คืน Connection
  }
};

// หาข้อมูลทริปจาก Invite Code (สำหรับ FR2.10)
export const getTripByInviteCode = async (invite_code: string) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT trip_id, trip_name, status FROM trips WHERE invite_code = ?`,
        [invite_code]
    );
    return rows[0]; // คืนค่า undefined ถ้าหาไม่เจอ
};



// ดึงสมาชิกเก่ากลับเข้าทริป (กรณีเคยออกไปแล้ว is_active = 0)
export const reactivateTripMember = async (trip_id: string, user_id: string) => {
    await pool.query(
        `UPDATE trip_members SET is_active = 1, role = 'member' 
         WHERE trip_id = ? AND user_id = ?`,
        [trip_id, user_id]
    );
};

export default {
    generateInviteCode,
    generateInviteLink,
    getTripDetail,
    getMyTrips,
    findTripByInviteCode,
    addMemberIfNotExists,
    findMemberInTrip,
    removeMemberById,
    deleteTrip,
    createTripWithMember,
    getTripStatus,
    getTripByInviteCode,
    reactivateTripMember,
    findAllTripsByUserId,
    getTripMembers
        
};
/*
    getTripById,
    updateTrip,
    deactivateTrip,
    activateTrip,
    addMemberToTrip,
    removeMemberFromTrip,
    getTripMembers,
    getTripsByUserId,
    confirmTrip,
    completeTrip,
    archiveTrip,
*/
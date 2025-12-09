import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2";

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

export async function getDashboardTrips(user_id: string): Promise<TripDashboardItem[]> {
    const sql = `
        SELECT 
            t.trip_id,
            t.trip_name,
            t.status,
            t.start_date,
            tm_user.role, -- Role ของเรา (Owner/Member)
            
            (SELECT COUNT(*) FROM trip_members WHERE trip_id = t.trip_id AND is_active = 1) as num_members,
            
            DATEDIFF(t.start_date, CURDATE()) as days_left

        FROM trips t
        JOIN trip_members tm_user ON t.trip_id = tm_user.trip_id
        
        WHERE tm_user.user_id = ? 
          AND tm_user.is_active = 1
        ORDER BY t.created_at DESC
    `;

    const [rows] = await pool.query<TripDashboardItem[] & RowDataPacket[]>(sql, [user_id]);
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
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
}

export async function generateInviteLink(tripId: string): Promise<string> {
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/join/${tripId}`;
}

/*
export async function deactivateTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET is_active = ? WHERE trip_id = ?',
        [false, tripId]
    );
}
*/
/*
export async function activateTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET is_active = ? WHERE trip_id = ?',
        [true, tripId]
    );
}
*/
/*
export async function addMemberToTrip(tripId: string, userId: string, role: 'owner' | 'member'): Promise<void> {
    const member_id = crypto.randomUUID();
    await pool.query(
        'INSERT INTO trip_members (member_id, trip_id, user_id, role) VALUES (?, ?, ?, ?)',
        [member_id, tripId, userId, role]
    );
}
*/
/*
export async function removeMemberFromTrip(tripId: string, userId: string): Promise<void> {
    await pool.query(
        'DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?',
        [tripId, userId]
    );
}  */ 
/*
export async function getTripMembers(tripId: string): Promise<TripMember[]> {
    const [rows] = await pool.query('SELECT * FROM trip_members WHERE trip_id = ?', [tripId]);
    return rows as TripMember[];
}
*/
/*
export async function getTripsByUserId(userId: string): Promise<Trip[]> {
    const [rows] = await pool.query(
        `SELECT t.* FROM trips t
         JOIN trip_members tm ON t.trip_id = tm.trip_id
         WHERE tm.user_id = ? AND t.is_active = ?`,
        [userId, true]
    );
    return rows as Trip[];
}   
*/
/*
export async function confirmTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET status = ?, confirmed_at = ? WHERE trip_id = ?',
        ['confirmed', new Date(), tripId]
    );
}
*/
/*
export async function completeTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET status = ? WHERE trip_id = ?',
        ['completed', tripId]
    );
}
*/
/*
export async function archiveTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET status = ? WHERE trip_id = ?',
        ['archived', tripId]
    );
}
*/
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

export const findMemberInTrip = async (trip_id: string, member_id: string) => {
  const [rows] = await pool.query<TripMember[]>(
    `SELECT * FROM trip_members WHERE trip_id = ? AND member_id = ? AND is_active = 1`,
    [trip_id, member_id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const removeMemberById = async (trip_id: string, member_id: string) => {
  return pool.query(
    `UPDATE trip_members SET is_active = 0 WHERE trip_id = ? AND member_id = ?`,
    [trip_id, member_id]
  );
};

export default {
    generateInviteCode,
    generateInviteLink,
    getTripDetail,
    getMyTrips,
    findTripByInviteCode,
    addMemberIfNotExists,
    findTripById,
    findMemberInTrip,
    removeMemberById,
    deleteTrip,
    createTripWithMember,
    getTripStatus,
   
        
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
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

export interface TripMember {
    member_id: string;
    trip_id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at?: Date;
    is_active?: boolean;
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

export async function createTrip(trip_id:string, owner_id:string, trip_name:string, description:string | null, num_days:number, invite_code:string, invite_link:string, status:'planning' | 'voting' | 'confirmed' | 'completed' | 'archived'): Promise<void> {
    await pool.query(
        'INSERT INTO trips (trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status]
    );
}

export async function getTripById(tripId: string): Promise<Trip | null> {
    const [rows] = await pool.query('SELECT * FROM trips WHERE trip_id = ?', [tripId]);
    const trips = rows as Trip[];
    return trips[0] || null;
}

export async function updateTrip(trip: Trip): Promise<void> {
    await pool.query(
        'UPDATE trips SET owner_id = ?, trip_name = ?, description = ?, num_days = ?, invite_code = ?, invite_link = ?, status = ? WHERE trip_id = ?',
        [trip.owner_id, trip.trip_name, trip.description, trip.num_days, trip.invite_code, trip.invite_link, trip.status, trip.trip_id]
    );
}

export async function deleteTrip(tripId: string,owner_id: string): Promise<void> {
    await pool.query('DELETE FROM trips WHERE trip_id = ? AND owner_id = ?', [tripId, owner_id]);
}   

export async function generateInviteCode(): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
}

export async function generateInviteLink(tripId: string): Promise<string> {
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/join/${tripId}`;
}


export async function deactivateTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET is_active = ? WHERE trip_id = ?',
        [false, tripId]
    );
}

export async function activateTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET is_active = ? WHERE trip_id = ?',
        [true, tripId]
    );
}

export async function addMemberToTrip(tripId: string, userId: string, role: 'owner' | 'member'): Promise<void> {
    const member_id = crypto.randomUUID();
    await pool.query(
        'INSERT INTO trip_members (member_id, trip_id, user_id, role) VALUES (?, ?, ?, ?)',
        [member_id, tripId, userId, role]
    );
}

export async function removeMemberFromTrip(tripId: string, userId: string): Promise<void> {
    await pool.query(
        'DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?',
        [tripId, userId]
    );
}   

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
    const [rows] = await pool.query('SELECT * FROM trip_members WHERE trip_id = ?', [tripId]);
    return rows as TripMember[];
}

export async function getTripsByUserId(userId: string): Promise<Trip[]> {
    const [rows] = await pool.query(
        `SELECT t.* FROM trips t
         JOIN trip_members tm ON t.trip_id = tm.trip_id
         WHERE tm.user_id = ? AND t.is_active = ?`,
        [userId, true]
    );
    return rows as Trip[];
}   

export async function confirmTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET status = ?, confirmed_at = ? WHERE trip_id = ?',
        ['confirmed', new Date(), tripId]
    );
}

export async function completeTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET status = ? WHERE trip_id = ?',
        ['completed', tripId]
    );
}

export async function archiveTrip(tripId: string): Promise<void> {
    await pool.query(
        'UPDATE trips SET status = ? WHERE trip_id = ?',
        ['archived', tripId]
    );
}
/*
export async function getTripByInviteCode(inviteCode: string): Promise<Trip | null> {
    const [rows] = await pool.query('SELECT * FROM trips WHERE invite_code = ?', [inviteCode]);
    const trips = rows as Trip[];
    return trips[0] || null;
}
*/
/*
export async function getTripByInviteLink(inviteLink: string): Promise<Trip | null> {
    const [rows] = await pool.query('SELECT * FROM trips WHERE invite_link = ?', [inviteLink]);
    const trips = rows as Trip[];
    return trips[0] || null;
}
*/

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

export default {
    createTrip,
    getTripById,
    updateTrip,
    deleteTrip,
    deactivateTrip,
    activateTrip,
    addMemberToTrip,
    removeMemberFromTrip,
    getTripMembers,
    getTripsByUserId,
    confirmTrip,
    completeTrip,
    archiveTrip,
    getMyTrips,
    getTripDetail,
};

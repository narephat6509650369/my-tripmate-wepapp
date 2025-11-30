import { pool } from "../config/db.js";
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

export interface TripMember {
    member_id: string;
    trip_id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at?: Date;
    is_active?: boolean;
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

export async function deleteTrip(tripId: string): Promise<void> {
    await pool.query('DELETE FROM trips WHERE trip_id = ?', [tripId]);
}   

export async function generateInviteCode(): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
}

export async function generateInviteLink(tripId: string): Promise<string> {
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/join/${tripId}`;
}

export async function initializeTrip(tripData: {
    trip_id: string;
    trip_name: string;
    description?: string | null;
    num_days: number;
}): Promise<Trip> {
    const owner_id = uuidv4();
    const invite_code = await generateInviteCode();
    const invite_link = await generateInviteLink(tripData.trip_id);

    const newTrip: Trip = {
        trip_id: tripData.trip_id,
        owner_id: owner_id,
        trip_name: tripData.trip_name,
        description: tripData.description || null,
        num_days: tripData.num_days,
        invite_code: invite_code,
        invite_link: invite_link,
        status: 'planning',
    };
    await createTrip(newTrip.trip_id, newTrip.owner_id, newTrip.trip_name, newTrip.description || null, newTrip.num_days, newTrip.invite_code, newTrip.invite_link, newTrip.status);
    return newTrip;
}

export async function initializeTripVoting(tripData: {
    owner_id: string;
    trip_name: string;
    description?: string | null;
    num_days: number;
}): Promise<Trip> {
    const trip_id = crypto.randomUUID();
    const invite_code = await generateInviteCode();
    const invite_link = await generateInviteLink(trip_id);
    const newTrip: Trip = {
        trip_id,
        owner_id: tripData.owner_id,
        trip_name: tripData.trip_name,
        description: tripData.description ?? null,
        num_days: tripData.num_days,
        invite_code,
        invite_link,
        status: 'voting',
    };
    await createTrip(newTrip.trip_id, newTrip.owner_id, newTrip.trip_name, newTrip.description || null, newTrip.num_days, newTrip.invite_code, newTrip.invite_link, newTrip.status);
    return newTrip;
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




export default {
    createTrip,
    getTripById,
    updateTrip,
    deleteTrip,
    initializeTrip,
    initializeTripVoting,
    deactivateTrip,
    activateTrip,
    addMemberToTrip,
    removeMemberFromTrip,
    getTripMembers,
    getTripsByUserId,
    confirmTrip,
    completeTrip,
    archiveTrip,
};
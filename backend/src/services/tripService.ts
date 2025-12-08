import { v4 as uuidv4 } from 'uuid';
import { createTripWithMember, generateInviteCode, generateInviteLink,getTripDetail,getMyTrips, findTripByInviteCode, addMemberIfNotExists, findTripById, findMemberInTrip, removeMemberById, deleteTrip, findAllTripsByUserId} from "../models/tripModel.js";
import type { Trip, MyTrip, TripDetail,  } from '../models/tripModel.js';

interface RemoveMemberParams {
  trip_id: string;
  member_id: string;
  owner_id: string;
}
//ผู้ใช้ fetch ข้อมูลหลังจากทำการ login ครั้งแรก

  
export const getUserTrips = async (user_id: string) => {
    // เรียก Database โดยตรง (ไม่ต้อง fetch)
    const allTrips = await findAllTripsByUserId(user_id);

    // ถ้าต้องการแยกข้อมูลให้ Frontend ใช้ง่ายๆ สามารถทำ Data Transformation ตรงนี้ได้
    const myTrips = allTrips.filter(t => t.role === 'owner');
    const joinedTrips = allTrips.filter(t => t.role === 'member');

    return {
        all: allTrips,     // ส่งไปทั้งหมด
        owned: myTrips,    // หรือจะแยกอาเรย์ให้เลยก็ได้
        joined: joinedTrips
    };
}

export const addTrip = async( user_id: string, trip_name: string, description: string | null, num_days: number): Promise<Trip> => {
    const trip_id = uuidv4();
    const member_id = uuidv4();
    const invite_code = await generateInviteCode();
    const invite_link = await generateInviteLink(trip_id);

    const newTrip: Trip = {
        trip_id: trip_id,
        owner_id: user_id,
        trip_name: trip_name,
        description: description ,
        num_days: num_days,
        invite_code: invite_code,
        invite_link: invite_link,
        status: 'planning',
    };
    await createTripWithMember(newTrip, member_id);
    return newTrip;
}

export async function getTripsByUserId(user_id: string): Promise<Trip[]> {
    return await getTripsByUserId(user_id);
}

export async function fetchMyTrips(userId: string): Promise<MyTrip[]> {
    return await getMyTrips(userId);
}

export async function fetchTripDetail(tripId: string): Promise<TripDetail | null> {
    return await getTripDetail(tripId);
}

export const joinTripServiceByCode = async (inviteCode: string, userId: string) => {

  const trip = await findTripByInviteCode(inviteCode);
  if (!trip) throw new Error("Invalid invite code");

  await addMemberIfNotExists(trip.trip_id, userId);

  return trip;
};

export const joinTripServiceByLink = async (tripId: string, userId: string) => {

  const trip = await findTripById(tripId);
  if (!trip) throw new Error("Invalid invite link");

  await addMemberIfNotExists(tripId, userId);

  return trip;
};

export const removeMemberService = async ({trip_id, member_id, owner_id}: RemoveMemberParams) => {
  // 1) ตรวจสอบ Trip
  const trip = await findTripById(trip_id);

  if (!trip) {
    return { success: false, error: "Trip not found" };
  }

  if (trip.owner_id !== owner_id) {
    return { success: false, error: "Only owner can remove members" };
  }

  // 2) ตรวจสอบ Member ใน trip
  const member = await findMemberInTrip(trip_id, member_id);

  if (!member) {
    return { success: false, error: "Member not found in this trip" };
  }

  if (member.role === "owner") {
    return { success: false, error: "Owner cannot remove themselves" };
  }

  // 3) ลบสมาชิก
  await removeMemberById(trip_id, member_id);

  return { success: true };
};

export const deleteTripService = async (tripId: string, ownerId: string) => {
   await deleteTrip(tripId,ownerId);
}


export default { findAllTripsByUserId, getTripsByUserId, joinTripServiceByLink,joinTripServiceByCode,removeMemberService,deleteTripService};
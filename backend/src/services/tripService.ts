import { v4 as uuidv4 } from 'uuid';
import { createTrip, generateInviteCode, generateInviteLink,getTripDetail,getMyTrips, findTripByInviteCode, addMemberIfNotExists, findTripById } from "../models/tripModel.js";
import type { Trip,MyTrip, TripDetail  } from '../models/tripModel.js';

export const tripService = async (userId: string,trip_name: string, description?: string | null, num_days?: number) => {
    const response = await fetch('/api/trips/AddTrip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(await initializeTrip({ user_id: userId, trip_name, description: description || null, num_days: num_days || 1 })),
    });
    return response.json();
  };
  
export async function initializeTrip(tripData: {
    user_id: string;
    trip_name: string;
    description?: string | null;
    num_days: number;
}): Promise<Trip> {
    const trip_id = uuidv4();
    const invite_code = await generateInviteCode();
    const invite_link = await generateInviteLink(trip_id);

    const newTrip: Trip = {
        trip_id: trip_id,
        owner_id: tripData.user_id,
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

export async function deleteTrip(trip_id: string, owner_id: string): Promise<void> {
    await deleteTrip(trip_id, owner_id);
    return ;
}


export async function getTripsByUserId(user_id: string): Promise<Trip[]> {
    return await getTripsByUserId(user_id);
}

/*
export async function getTripDetail(trip_id: string): Promise<Trip | null> {
    return await getTripById(trip_id);
}
*/

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

export default {tripService, deleteTrip, initializeTrip, getTripsByUserId, joinTripServiceByLink,joinTripServiceByCode};
import { v4 as uuidv4 } from 'uuid';
import * as tripModel from '../models/tripModel.js';
import { getTripSummaryById, type Trip } from '../models/tripModel.js';

/**
 * สร้างทริปใหม่ พร้อมเพิ่มผู้สร้างเป็นสมาชิกคนแรก (Owner)
 */
export const addTrip = async (owner_id: string,trip_name: string,description: string | null,num_days: number) => {
  // 1. สร้าง IDs
  const trip_id = uuidv4();
  const member_id = uuidv4();
  
  // 2. สร้างรหัสเชิญ
  const invite_code = await tripModel.generateInviteCode();
  const invite_link = await tripModel.generateInviteLink(invite_code);
  
  // 3. สร้าง Trip Object
  const tripData: Trip = {
    trip_id,
    owner_id,
    trip_name,
    description,
    num_days,
    invite_code,
    invite_link,
    status: 'planning',
    is_active: true
  };
  
  // 4. บันทึกลง Database (Trip + Member ใน Transaction)
  await tripModel.createTripWithMember(tripData, member_id);
  
  return {
    trip_id,
    owner_id,
    trip_name,
    description,
    num_days,
    invite_code,
    invite_link,
    status: 'planning'
  };
};

/**
 * ดึงทริปทั้งหมดของ User (เจ้าของ + เข้าร่วม)
 */
export const getUserTrips = async (user_id: string) => {
  // ดึงทริปทั้งหมด
  const allTrips = await tripModel.findAllTripsByUserId(user_id);
  
  // แยกตาม role
  const owned = allTrips.filter(t => t.role === 'owner');
  const joined = allTrips.filter(t => t.role === 'member');
  
  return {
    all: allTrips,
    owned,
    joined
  };
};

/**
 * 
 * ดึงทริป detail (เฉพาะทริปที่เป็นสมาชิกอยู่โดยข้อมูลทริปแบบละเอียดของทริปหนึ่ง)
 *  
 */
export const getTripDetail = async (tripCode: string) => {
  try{
    const trip = await tripModel.getTripDetail(tripCode);

    if (!trip) {
      throw new Error("Trip not found");
    }
    
    return trip;
  }
  
  catch (error) {
    console.error("Get trip detail error:", error instanceof Error ? error.message : error);
    throw new Error(error instanceof Error ? error.message : "An error occurred while fetching trip details");
  }
}


/**
 * ลบทริป (เฉพาะ Owner + สถานะต้องเป็น 'planning')
 */
export const deleteTripService = async (trip_id: string) => {
  // 1. เช็คสถานะก่อน
  const status = await tripModel.getTripStatus(trip_id);
  
  if (!status) {
    throw new Error("ไม่พบทริป");
  }
  
  if (status !== 'planning') {
    throw new Error(`ไม่สามารถลบทริปที่มีสถานะ '${status}' ได้`);
  }
  
  // 2. ลบทริป
  await tripModel.deleteTrip(trip_id);
  
  return { success: true, message: "ลบทริปสำเร็จ" };
};

/**
 * เข้าร่วมทริปด้วยรหัสเชิญ
 */
export const joinTripByCode = async (invite_code: string, user_id: string) => {
  const trip = await tripModel.getTripByInviteCode(invite_code);

  if (!trip) throw new Error("Invalid invite code");

  if (trip.status === 'archived' || trip.status === 'completed') {
    throw new Error("Trip closed");
  }

  const members = await tripModel.getTripMembers(trip.trip_id);
  const existingMember = members.find(m => m.user_id === user_id);

  if (existingMember && existingMember.is_active) {
    throw new Error("You are already a member of this trip");
  }

  if (existingMember && !existingMember.is_active) {
    await tripModel.reactivateTripMember(trip.trip_id, user_id);
    return {
      trip_id: trip.trip_id,
      trip_name: trip.trip_name,
      rejoined: true
    };
  }

  await tripModel.addMemberIfNotExists(trip.trip_id, user_id);

  return {
    trip_id: trip.trip_id,
    trip_name: trip.trip_name,
    rejoined: false
  };
};


/**
 * ลบสมาชิกออกจากทริป (เฉพาะ Owner)
 */
export const removeMemberService = async (params: {trip_id: string;member_id: string;owner_id: string;}) => {
  const { trip_id, member_id, owner_id } = params;
  
  // 1. เช็คว่าผู้เรียกเป็น owner หรือไม่
  const trip = await tripModel.getTripDetail(trip_id);
  
  if (!trip) {
    return { success: false, error: "ไม่พบทริป" };
  }
  
  if (trip.owner_id !== owner_id) {
    return { success: false, error: "เฉพาะเจ้าของทริปเท่านั้นที่ลบสมาชิกได้" };
  }
  
  // 2. เช็คว่าสมาชิกอยู่ในทริปหรือไม่
  const member = await tripModel.findMemberInTrip(trip_id, member_id);
  
  if (!member) {
    return { success: false, error: "ไม่พบสมาชิกในทริป" };
  }
  
  // 3. ห้ามลบตัวเอง (Owner)
  if (member.user_id === owner_id) {
    return { success: false, error: "เจ้าของทริปไม่สามารถลบตัวเองได้" };
  }
  
  // 4. ลบสมาชิก (Soft Delete + ลบ Availability)
  await tripModel.removeMemberById(trip_id, member_id);
  
  return { success: true, message: "ลบสมาชิกสำเร็จ" };
};

//
export const TripDetail = async (tripCode: string) => {
  const trip = await tripModel.getTripDetail(tripCode);
  return trip;
}

export const findById = async (tripId: string) => {
  const trip = await tripModel.findTripById(tripId);
  return trip;
}

export async function getTripSummaryService(tripId: string,userId: string) {
  const summary = await getTripSummaryById(tripId);

  if (!summary) {
    throw new Error("Trip not found");
  }

  // ตรวจสอบสิทธิ์: ต้องเป็นสมาชิก
  const isMember = summary.members.some( (m: any) => m.user_id === userId );

  if (!isMember) {
    throw new Error("FORBIDDEN");
  }

  return summary;
}

export default {
  addTrip,
  getUserTrips,
  deleteTripService,
  joinTripByCode,
  removeMemberService,
  TripDetail,
  findById,
  getTripDetail,
  getTripSummaryService,
  
};
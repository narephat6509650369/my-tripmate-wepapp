import { v4 as uuidv4 } from 'uuid';
import * as tripModel from '../models/tripModel.js';
import { closeTrip, getTripSummaryById, type Trip } from '../models/tripModel.js';
import * as voteService from '../services/voteService.js';
import notiService from './notiService.js';


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
  try{

    await autoCloseEligibleTripsForUser(user_id);

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

  } catch (error) {
    console.error("Get user trips error:", error instanceof Error ? error.message : error);
    throw new Error(error instanceof Error ? error.message : "An error occurred while fetching user trips");
  }
};

export const autoCloseEligibleTripsForUser = async (user_id: string) => {
  const openTrips = await tripModel.findOpenTripsByUserId(user_id);

  for (const trip of openTrips) {
    await closeTripService(trip.trip_id, "auto");
  }
};


/**
 * 
 * ดึงทริป detail (เฉพาะทริปที่เป็นสมาชิกอยู่โดยข้อมูลทริปแบบละเอียดของทริปหนึ่ง)
 *  
 */
export const getTripDetail = async (tripId: string) => {
  try{
    await closeTripService(tripId, "auto");

    const trip = await tripModel.getTripDetail(tripId);

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
  try{
  const trip = await tripModel.getTripByInviteCode(invite_code);

  if (!trip) throw new Error("Invalid invite code");

  if (trip.status === 'archived' || trip.status === 'completed'|| trip.status === 'confirmed') {
    return {
      success: false,
      message: `ไม่สามารถเข้าร่วมทริปทีได้เนื่องจากทริปถูกปิดไปแล้ว (สถานะ: ${trip.status})`
    };
  }

  const members = await tripModel.getTripMembers(trip.trip_id);
  const existingMember = members.find(m => m.user_id === user_id);

  if (existingMember && existingMember.is_active) {
    return {
      success: false,
      message: "คุณเป็นสมาชิกของทริปนี้อยู่แล้ว"
    };
  }

  if (existingMember && !existingMember.is_active) {
  await tripModel.reactivateTripMember(trip.trip_id, user_id);

  await notiService.notifyMemberJoined(trip.trip_id, user_id);

  return {
    success: true,
    trip_id: trip.trip_id,
    trip_name: trip.trip_name,
    rejoined: true,
    message: "เข้าร่วมทริปสำเร็จ (rejoined)"
  };
  }


  await tripModel.addMemberIfNotExists(trip.trip_id, user_id);

  await notiService.notifyMemberJoined(trip.trip_id, user_id);

  return {
    success: true,
    trip_id: trip.trip_id,
    trip_name: trip.trip_name,
    rejoined: false,
    message: "เข้าร่วมทริปสำเร็จ"
  };
  } catch (error) {
    console.error("Join trip error:", error);
    return {
      success: false,
      message: "An error occurred while joining the trip"
    };
  }
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

export async function getTripSummaryService(tripId: string,user_id: string) {
  try{

  const summary = await getTripSummaryById(tripId);

  if (!summary) {
    throw new Error("Trip not found");
  }

  // ตรวจสอบสิทธิ์: ต้องเป็นสมาชิก
  const isMember = summary.members.some( (m: any) => m.user_id === user_id );

  if (!isMember) {
    throw new Error("FORBIDDEN");
  }
  //console.log("members:",summary.members);
   
  const getVoteNumber = await tripModel.getStatusVoteResult(tripId);
  

  const tripStatus = summary.trip[0].status;
  //console.log("Trip Status:", tripStatus);
  //เช็คสถานะทริป ถ้าเป็น planning จะยังไม่แสดงผลโหวต จนกว่าคนจะโหวเสร็จ
  if (tripStatus === 'planning' ) {
    return {
      summary,
      getVoteNumber
    }
  }
  const budgetVotes = await voteService.getvoteBudget(tripId,user_id);
  const locationResult = await voteService.getvoteLocation(tripId,user_id);
  const dateOptions = await voteService.getvoteDate(tripId,user_id);

  return { 
    summary, 
    budgetVotes, 
    locationResult, 
    dateOptions 
  };

  } catch (error) {
    console.error("Get trip summary error:", error instanceof Error ? error.message : error);
    throw new Error(error instanceof Error ? error.message : "An error occurred while fetching trip summary");
  }
}

export const closeTripService = async (tripId: string,type: string,user_id?: string) => {

  const trip = await tripModel.findTripById(tripId);

  if (!trip) {
    return { success: false, message: "ไม่พบทริป" };
  }

  if (["archived", "completed", "confirmed"].includes(trip.status)) {
    return { success: false, message: "ทริปถูกปิดไปแล้ว" };
  }

  const memberCount = await tripModel.getTripMemberCount(tripId);

  // AUTO CLOSE 
  if (type === "auto") {

    if (memberCount <= 1) {
      return {
        success: false,
        message: "จำนวนสมาชิกไม่เพียงพอสำหรับการปิดอัตโนมัติ"
      };
    }

    const isExpired = (createdAt: Date, days: number) => {
      const diffTime = Date.now() - new Date(createdAt).getTime();
      return diffTime / (1000 * 3600 * 24) > days;
    };

    // 1️ Expired → Archived
    if (isExpired(trip.created_at, 7)) {
      await closeTrip(tripId, "archived");

      // notify archived
      await notiService.notifyTripArchived?.(tripId);

      return {
        success: true,
        message: "ทริปถูกปิดอัตโนมัติเนื่องจากเปิดเกิน 7 วันแล้ว"
      };
    }

    // 2 Vote Complete → Completed
    const votes = await tripModel.getStatusVoteResult(tripId);

    const isVoteComplete =
      votes.dateVoteNum === votes.totalMembers &&
      votes.budgetVoteNum === votes.totalMembers &&
      votes.locationVoteNum === votes.totalMembers;

    if (isVoteComplete) {

      // notify voting closed (ตอนโหวตครบจริง)
      await notiService.notifyTripCompleted(tripId);

      await closeTrip(tripId, "completed");

      return {
        success: true,
        message: "ทริปถูกปิดอัตโนมัติเนื่องจากสมาชิกโหวตครบทุกคนแล้ว"
      };
    }

  }

  // MANUAL CLOSE 
  else if (type === "manual") {

    const ownerId = await tripModel.getTripOwnerId(tripId);

    if (user_id === ownerId) {

      await closeTrip(tripId, "confirmed");

      // notify confirmed
      await notiService.notifyTripConfirmed(tripId);

      return {
        success: true,
        message: "ทริปถูกปิดโดยเจ้าของทริป"
      };
    }

    return {
      success: false,
      message: "เฉพาะเจ้าของทริปเท่านั้นที่สามารถปิดทริปได้"
    };
  }

  return {
    success: false,
    message: "เงื่อนไขการปิดทริปยังไม่ครบถ้วน"
  };
};

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
  closeTripService
};



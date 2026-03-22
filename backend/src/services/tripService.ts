import { v4 as uuidv4 } from 'uuid';
import * as tripModel from '../models/tripModel.js';
import { closeTrip, getTripSummaryById, type Trip } from '../models/tripModel.js';
import * as voteService from '../services/voteService.js';
import notiService from './notiService.js';
import { PromptService } from "./promptService.js";

type GetMemberServiceResponse = | { success: true; data: tripModel.TripMember[] } | { success: false; message: string };
/**
 * สร้างทริปใหม่ พร้อมเพิ่มผู้สร้างเป็นสมาชิกคนแรก (Owner)
 */
export const addTrip = async (owner_id: string,trip_name: string,description: string | null,num_days: number) => {
  try {
    // 1. สร้าง IDs
    const trip_id = uuidv4();
    const member_id = uuidv4();

    // 2. สร้าง invite code + link
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
      status: "planning",
      is_active: true
    };

    // 4. บันทึกลง Database
    await tripModel.createTripWithMember(tripData, member_id);

    // 5. return success
    return {
      success: true,
      message: "สร้างทริปสำเร็จ",
      data: {
        trip_id,
        owner_id,
        trip_name,
        description,
        num_days,
        invite_code,
        invite_link,
        status: "planning"
      }
};

  } catch (error) {
    console.error("addTrip service error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create trip"
    };
  }
};

/**
 * ดึงทริปทั้งหมดของ User (เจ้าของ + เข้าร่วม)
 */
export const getUserTrips = async (user_id: string) => {
  try{
    //เอาไว้เช็คว่าครบ 7ิ วันรึยังถ้าครบก็ปิด trip เลย
    await autoCloseEligibleTripsForUser(user_id);

    // ดึงทริปทั้งหมด
    const allTrips = await tripModel.findAllTripsByUserId(user_id);
  
    // แยกตาม role
    const owned = allTrips.filter(t => t.role === 'owner');
    const joined = allTrips.filter(t => t.role === 'member');
  
    return {
      success: true,
      message: "โหลดข้อมูลทริปสำเร็จแล้ว",
      data: {
        all: allTrips,
        owned,
        joined
      }
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

    //console.log("getTripDetail",trip)
 if (!trip) {
      return {
        success: false,
        message: "ไม่พบทริป"
      };
    }

    return {
      success: true,
      message: "ดึงข้อมูลรายละเอียดทริปสำเร็จแล้ว",
      data: trip
    };
  }
  
  catch (error) {
    console.error("Get trip detail error:", error instanceof Error ? error.message : error);
    throw new Error(error instanceof Error ? error.message : "An error occurred while fetching trip details");
  }
}



export const deleteTripService = async (trip_id: string,owner_id: string) => {
  try {
    // 1. เช็คสถานะก่อน
    const status = await tripModel.getTripStatus(trip_id);

    if (!status) {
      return {
        success: false,
        message: "ไม่พบทริป"
      };
    }

    if (status !== "planning") {
      return {
        success: false,
        message: `ไม่สามารถลบทริปที่มีสถานะ '${status}' ได้`
      };
    }

    // 2. ลบทริป
    await tripModel.deleteTrip(trip_id,owner_id);

    return {
      success: true,
      message: "ลบทริปสำเร็จ"
    };

  } catch (error) {
    console.error("deleteTripService error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการลบทริป"
    };
  }
};

/**
 * เข้าร่วมทริปด้วยรหัสเชิญ
 */
export const requestJoinTripByCode = async (invite_code: string,user_id: string) => {

  try {

    const trip = await tripModel.getTripByInviteCode(invite_code);

    if (!trip) {
      return {
        success: false,
        message: "Invalid invite code"
      };
    }

    // check trip closed
    if (
      trip.status === "archived" ||
      trip.status === "completed" ||
      trip.status === "confirmed"
    ) {
      return {
        success: false,
        message: "ทริปนี้ปิดรับสมาชิกแล้ว"
      };
    }

    const members = await tripModel.getMemberByTripAndUser(trip.trip_id, user_id);
    const member = members?.[0] ?? null

    // ไม่เคยเป็นสมาชิกมาก่อน
    if (!member) {
      await tripModel.addPendingMember(trip.trip_id, user_id);

     const noti = await notiService.notifyOwnerJoinRequest(trip.trip_id, user_id);
     console.log("noti:",noti)

      return {
        success: true,
        message: "ส่งคำขอเข้าร่วมสำเร็จ กรุณารอ Owner อนุมัติ",
        trip_id: trip.trip_id,
        trip_name: trip.trip_name,
        owner_id: trip.owner_id
      };
    }

    // already active
    if (member.status === "active") {
      return {
        success: false,
        message: "คุณเป็นสมาชิกอยู่แล้ว"
      };
    }

    // already pending
    if (member.status === "pending") {
      return {
        success: false,
        message: "คุณส่งคำขอไปแล้ว กรุณารอเจ้าของทริปอนุมัติ"
      };
    }

    // rejected → request again
    if (member.status === "rejected") {
      await tripModel.updateMemberStatus(trip.trip_id, user_id, "pending");

      await notiService.notifyOwnerJoinRequest(trip.trip_id, user_id);

      return {
        success: true,
        message: "ส่งคำขอใหม่สำเร็จ กรุณารอ Owner อนุมัติ",
        trip_id: trip.trip_id,
        trip_name: trip.trip_name,
        owner_id: trip.owner_id
      };
    }

    // fall back
      return {
        success: false,
        message: "Invalid member status"
      };
  } catch (error) {

    console.error("requestJoinTripByCode error:", error);

    return {
      success: false,
      message: "Cannot request join trip"
    };

  }

};

export const getPendingRequests = async (trip_id: string, user_id: string) => {

  try {

    const pending = await tripModel.getPendingMembers(trip_id);
    //console.log("pending",pending);

    return {
      success: true,
      message: "ดึงรายการคำขอเข้าร่วมทริปสำเร็จแล้ว",
      data: pending
    };

  } catch (error) {

    console.error("getPendingRequests error:", error);

   return {
    success: false,
    message: "ไม่สามารถดึงคำขอเข้าร่วมทริปได้",
    data: []
  };

  }

};

export const approveMember = async (trip_id: string,user_id: string,owner_id: string) => {

  try {

    // check owner permission
    const owner = await tripModel.getTripOwner(trip_id);
    //console.log("owner.user_id",owner.user_id);
    //console.log("owner_id",owner_id);
    if (owner.user_id !== owner_id) {

      return {
        success: false,
        message: "เฉพาะเจ้าของทริปเท่านั้นที่สามารถอนุมัติสมาชิกได้"
      };

    }

    console.log("Member:",user_id);

    await tripModel.approveMemberModel(trip_id,user_id);

    await notiService.notifyMemberApproved(trip_id,user_id);

    return {
      success: true,
      message: "อนุมัติสำเร็จ"
    };

  } catch (error) {

    console.error("approveMember error:", error);

    return {
      success: false,
      message: "Approve failed"
    };

  }

};

export const rejectMember = async (trip_id: string,user_id: string,owner_id: string) => {

  try {

   const owner = await tripModel.getTripOwner(trip_id);

  if (owner.user_id !== owner_id) {

      return {
        success: false,
        message: "เฉพาะเจ้าของทริปเท่านั้นที่สามารถปฏิเสธสมาชิกได้"
      };

    }

    const trip = await tripModel.getMemberWithEmailPending(trip_id,user_id);

    if(!trip.email){
      return {
        success: false,
        message: "Not have email for reject Member"
      }
    }

    if(!trip.full_name){
      return {
        success: false,
        message: "Not name for reject Member"
      }
    }

    await tripModel.rejectMember(trip_id,user_id);

    const noti = await notiService.notifyMemberRejected(trip_id,user_id,trip.email,trip.full_name);

    console.log("noti reject:",noti)

    return {
      success: true,
      message: "ปฏิเสธสำเร็จ"
    };

  } catch (error) {

    console.error("rejectMember error:", error);

    return {
      success: false,
      message: "Reject failed"
    };

  }

};

/**
 * ลบสมาชิกออกจากทริป (เฉพาะ Owner)
 */
export const removeMemberService = async ( trip_id: string, member_id: string, owner_id: string ) => {

  // ตรวจสอบว่าทริปมีอยู่จริง
  const trip = await tripModel.getTripDetail(trip_id);

  if (!trip) {
    return { success: false, error: "ไม่พบทริป" };
  }

  // ตรวจสอบสิทธิ์ owner
  if (trip.ownerid !== owner_id) {
    return {
      success: false,
      error: "เฉพาะเจ้าของทริปเท่านั้นที่ลบสมาชิกได้"
    };
  }

  // ห้าม owner ลบตัวเอง
  if (owner_id === member_id) {
    return {
      success: false,
      error: "เจ้าของทริปไม่สามารถลบตัวเองได้"
    };
  }

  // ตรวจสอบว่าสมาชิกอยู่ในทริป และยัง active อยู่
  const member = await tripModel.findMemberInTrip(trip_id, member_id);

  if (!member) {
    return {
      success: false,
      error: "ไม่พบสมาชิกในทริป"
    };
  }

  // ทำ Soft Delete + ลบ availability ภายใน transaction
  const res = await tripModel.removeMemberById(trip_id, member_id);

  return {
    success: true,
    message: "ลบสมาชิกสำเร็จ",
    member_id: res.user_id
  };
};

export type PromptTemplate =| "comprehensive"| "itinerary"| "budget"| "activities"| "accommodation";

export async function getTripSummaryService(tripId: string, user_id: string, template: PromptTemplate = "comprehensive") {
  try {
    const summary = await getTripSummaryById(tripId);

    if (!summary) {
      throw new Error("Trip not found");
    }

    // ตรวจสอบสิทธิ์: ต้องเป็นสมาชิก
    const isMember = summary.members.some((m: any) => m.user_id === user_id);
    
    if (!isMember) {
      throw new Error("FORBIDDEN");
    }
    
    const getVoteNumber = await tripModel.getStatusVoteResult(tripId);
    const tripStatus = summary.trip.status;

    // ถ้ายังอยู่ระหว่างโหวต ยังไม่ต้องเรียก AI
    if (tripStatus === "planning") {
      return { success: true, message: "ดึงข้อมูลสรุปทริปสำเร็จแล้ว", data: { summary, getVoteNumber } };
    }

    // ดึงผลโหวตทั้งหมด
    const [budgetVotes, locationResult, dateOptions] = await Promise.all([
      voteService.getvoteBudget(tripId, user_id),
      voteService.getvoteLocation(tripId, user_id),
      voteService.getvoteDate(tripId, user_id),
    ]);

    // Map โครงสร้างให้ตรงกับที่ PromptService คาดหวัง
    const winner = locationResult?.locationVotesTotal
    ?.sort((a: any, b: any) => b.total_score - a.total_score)?.[0];

  const mappedLocation = winner
    ? {
        province_name: winner.place,
        vote_count: winner.total_score,
      }
    : null;

    const mappedBudget = budgetVotes?.stats
      ? {
        accommodation: budgetVotes.stats.accommodation?.q2 ?? 0,
        transport: budgetVotes.stats.transport?.q2?? 0,
        food: budgetVotes.stats.food?.q2?? 0,
        other: 0,
      }
    : null;

    const mappedDate = dateOptions?.recommendation
      ? {
        final_dates:  dateOptions.recommendation.dates ?? [],
        voter_count:  dateOptions.summary?.totalMembers ?? 0,
      }
      : null;

    const mappedTrip = {
        trip_name: summary.trip.tripname ?? summary.trip.trip_name,
        num_days:  summary.trip.numdays  ?? summary.trip.num_days,
        trip_code: summary.trip.tripcode ?? summary.trip.trip_code,
        description: summary.trip.description,
      };

    // เรียก PromptService ด้วย mapped data
    const { prompt, metadata } = PromptService.buildPromptWithMetadata(
      {
        trip: mappedTrip,
        members: summary.members,
        locationResult: mappedLocation,
        budgetResult: mappedBudget,
        dateResult: mappedDate,
      },
      {
        template: (template as PromptTemplate) || "comprehensive",
        model: "gpt-4o-mini",
        structured: true,
        includeCOT: true,
      }
    );

  return {
  success: true,
  message: "ดึงข้อมูลสรุปทริปสำเร็จแล้ว",
  data: {
    summary,
    getVoteNumber,
    budgetVotes,
    locationResult,
    dateOptions,
    aiSummary: prompt,
    aiMeta: metadata,
  }
  };

  } catch (error) {
    console.error(
      "Get trip summary error:",
      error instanceof Error ? error.message : error
    );
    throw new Error(
      error instanceof Error
        ? error.message
        : "An error occurred while fetching trip summary"
    );
  }
}

export const closeTripService = async (tripId: string, type: string, user_id?: string) => {

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
    // const votes = await tripModel.getStatusVoteResult(tripId);

    // const isVoteComplete =
    //   votes.dateVoteNum === votes.totalMembers &&
    //   votes.budgetVoteNum === votes.totalMembers &&
    //   votes.locationVoteNum === votes.totalMembers;

    // if (isVoteComplete) {

    //   // notify voting closed (ตอนโหวตครบจริง)
    //   await notiService.notifyTripCompleted(tripId);

    //   await closeTrip(tripId, "completed");

    //   return {
    //     success: true,
    //     message: "ทริปถูกปิดอัตโนมัติเนื่องจากสมาชิกโหวตครบทุกคนแล้ว"
    //   };
    // }

  }

  // MANUAL CLOSE
  else if (type === "manual") {

    const owner = await tripModel.getTripOwner(tripId);

    if (user_id === owner.user_id) {
      await closeTrip(tripId, "confirmed");
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

export const getMemberService = async (tripId: string,ownerId: string): Promise<GetMemberServiceResponse> => {
  try {

    if (!tripId) {
      return {
        success: false,
        message: "Trip not found"
      };
    }

    const owner = await tripModel.getTripOwner(tripId);

    if (owner.user_id !== ownerId && owner.ownerid !== ownerId) {
      return {
        success: false,
        message: "You're not owner of this trip"
      };
    }

    const members = await tripModel.getTripMembers(tripId);

    if (!members || !Array.isArray(members)) {
      return {
        success: false,
        message: "Failed to retrieve members"
      };
    }

    return {
      success: true,
      data: members
    };

  } catch (error) {
    console.error("getMemberService error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get members"
    };
  }
};

export const editTripService = async (tripId: string,ownerId: string,description: string) => {

   const trip = await tripModel.findTripById(tripId);

  if (!trip) {
    return { success: false, message: "ไม่พบทริป" };
  }

  const owner = await tripModel.getTripOwner(tripId);

    if (owner.user_id !== ownerId && owner.ownerid !== ownerId) {
      return {
        success: false,
        message: "You're not owner of this trip"
      };
    }

  await tripModel.updateDescription(tripId, description);

  return {
    success: true,
    data: {
      tripId,
      description
    }
  };
};

export default {
  addTrip,
  getUserTrips,
  deleteTripService,
  removeMemberService,
  getTripDetail,
  getTripSummaryService,
  closeTripService,
  getMemberService,
  requestJoinTripByCode,
  rejectMember,
  approveMember,
  getPendingRequests,
  editTripService
};


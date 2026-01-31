import { v4 as uuidv4 } from 'uuid';
import * as voteModel from '../models/voteModel.js';
import * as tripModel from '../models/tripModel.js';

export interface DateRange {
    available_date: string;
}

export interface HeatmapData {
    [date: string]: string[];
}

type LocationVotePayload = {
  place: string;
  score: number;
};

// ===================== DATE VOTING =====================
/**
 * 1. บันทึกวันว่างของ User
 */
export const submitAvailability = async ( trip_id: string, user_id: string, dates?: string[] ) => {
   // ยังไม่โหวต
  if (!dates || dates.length === 0) {
    return {
      success: false,
      message: "No availability dates provided",
      rangesInserted: 0
    };
  }

  // clear ของเดิม
  
  await voteModel.clearUserAvailability(trip_id, user_id);
  
  for (const date of dates) {
    await voteModel.addAvailability(
      trip_id,
      user_id,
      new Date(date)
    );
  }

  return {
    success: true,
    message: "Availability saved",
    rangesInserted: dates.length
  };
};

/**
 * 2. ดึงข้อมูล Heatmap (วันไหนคนว่างเยอะสุด)
 */
/*
export const getTripHeatmap = async (trip_id: string, user_id: string): Promise<HeatmapData> => {
  const rawData = await voteModel.getTripAvailabilities(trip_id, user_id);
  
  const heatmap: HeatmapData = {};

  rawData.forEach((entry: any) => {
    const dateStr = entry.available_date.toISOString().slice(0, 10);
    if (!heatmap[dateStr]) {
      heatmap[dateStr] = [];
    }
    heatmap[dateStr].push(entry.user_id);
  });

  return heatmap;
};
*/

/**
 * 3. เปิดห้องโหวต + เปลี่ยนสถานะทริปเป็น 'voting'
 */
/*
export const startVotingSession = async (trip_id: string, user_id: string) => {
  if (!trip_id) {
    throw new Error("trip_id is required");
  }
  if (!user_id) {
    throw new Error("user_id is required");
  }
  // 1. เช็คว่ามีห้องโหวต active อยู่แล้วไหม
  const existingSession = await voteModel.getActiveDateVotingByTrip(trip_id);
  if (existingSession) {
    throw new Error("A voting session is already active for this trip.");
  }

  // 2. เช็คว่า user เป็น owner หรือไม่
  const trip = await tripModel.getTripDetail(trip_id);
  if (!trip) throw new Error("Trip not found");
  if (trip.owner_id !== user_id) {
    throw new Error("Only trip owner can start voting session");
  }

  const date_voting_id = uuidv4();

  // 3. Transaction: สร้างห้องโหวต + อัปเดตสถานะทริป
  const connection = await voteModel.getConnection();
  try {
    await connection.beginTransaction();

    await voteModel.insertDateVoting(connection, date_voting_id, trip_id);
    await tripModel.updateTripStatus(connection, trip_id, 'voting');

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
*/
export const getTripDateMatchingResult = async (tripId: string, userId: string) => {
  const userAvailabilityRows = await voteModel.getTripAvailabilities(tripId, userId);
  const availabilities = await voteModel.getAvailabilitiesByTrip(tripId);
  const totalMembers = await voteModel.getActiveMemberCount(tripId);

  if (!availabilities.length || totalMembers === 0) {
    return {
      table: {},
      intersection: [],
      weighted: [],
      totalMembers
    };
  }

  /**
   * table structure:
   * {
   *   "2025-01-10": ["user1","user2"],
   *   "2025-01-11": ["user2"]
   * }
   */
  const table: Record<string, string[]> = {};

  for (const row of availabilities) {
    const day = row.available_date;
    if (!table[day]) {
      table[day] = [];
    }
    table[day].push(row.user_id);
  }

  // วันที่ทุกคนว่างตรงกัน
  const intersection = Object.entries(table)
    .filter(([_, users]) => users.length === totalMembers)
    .map(([day]) => day);

  // weighted score
  const weighted = Object.entries(table)
    .map(([day, users]) => ({
      day,
      freeMembers: users.length,
      score: (users.length / totalMembers) * 100
    }))
    .sort((a, b) => b.score - a.score);

  //เพิ่ม algorithm คำนวณวันที่ใกล้กัน 3 อันดับแรก
  console.log("Date Matching Result", {
    table,
    intersection,
    weighted,
    totalMembers
  });

  return {
    userAvailabilityRows,
    table,          // ใช้แสดงเป็นตาราง / heatmap
    intersection,   // วันตรงกัน 100%
    weighted,       // วันแนะนำ (เรียงตาม %)
    totalMembers
  };
};




// ===================== BUDGET VOTING =====================

/**
 * 4. ดึงข้อมูลทริปทั้งหมด (สำหรับหน้า Vote)
 */
/*
export const getFullTripData = async (tripCode: string) => {
  // 1. หาทริปจาก invite_code
  const trip = await tripModel.getTripByInviteCode(tripCode);
  if (!trip) throw new Error("Trip not found");
  if(!trip.user_id){
    throw new Error("Trip owner ID not found");
  }
  const user_id = trip.user_id;
  
  const trip_id = trip.trip_id;
  
  // 2. ดึงข้อมูลทั้งหมด
  const [members, budgets, locationScores, availabilities] = await Promise.all([
    tripModel.getTripMembers(trip_id),
    voteModel.getTripBudgets(trip_id),
    voteModel.getLocationScores(trip_id),
    voteModel.getTripAvailabilities(trip_id, user_id)
  ]);

  // 3. Transform Data ให้ตรงกับ Frontend Format
  const formattedMembers = members.map((m: any) => {
    // จัดกลุ่ม budget ตาม user_id
    const userBudgets = budgets.filter((b: any) => b.user_id === m.user_id);
    const budgetObj: any = {
      accommodation: 0,
      transport: 0,
      food: 0,
      other: 0,
      lastUpdated: 0
    };

    userBudgets.forEach((b: any) => {
      const category = b.category_name;
      budgetObj[category] = Number(b.estimated_amount);
      
      const time = new Date(b.last_updated).getTime();
      if (time > budgetObj.lastUpdated) {
        budgetObj.lastUpdated = time;
      }
    });

    // Mock availability (ต้องแปลงจาก DB -> Boolean Array ตาม Frontend)
    // TODO: Implement proper mapping based on fixed date headers
    const availabilityBools = Array(8).fill(false);

    return {
      id: m.user_id,
      name: m.full_name || m.user_id,
      gender: m.gender || 'ชาย',
      availability: availabilityBools,
      budget: budgetObj
    };
  });

  // 4. Location scores
  const voteOptions = locationScores.map((l: any) => l.province_name);
  
  const provinces = locationScores.map((l: any) => ({
    name: l.province_name,
    score: Number(l.total_score)
  }));

  return {
    trip: {
      trip_id: trip.trip_id,
      trip_name: trip.trip_name,
      inviteCode: trip.invite_code,
      status: trip.status
    },
    members: formattedMembers,
    budgets,
    locationScores,
    availabilities,
    voteOptions,
    voteResults: {
      provinces,
      dates: [] // TODO: Calculate from availabilities
    }
  };
};
*/


/**
 * 5. อัปเดตงบประมาณ
 */
export const updateBudget = async ( tripid: string,user_id: string,category: string,amount: number ) => {
  // 1. Validate
  const validCategories = ['accommodation', 'transport', 'food', 'other'];
  if (!validCategories.includes(category)) {
    throw new Error("Invalid category");
  }

  if (amount < 0) {
    throw new Error("Amount must not be negative");
  }

  // 2. หาทริป
  const trip = await tripModel.findTripById(tripid);
  if (!trip) throw new Error("Trip not found");

  // 3. เช็คสมาชิก
  const members = await tripModel.getTripMembers(trip.trip_id);
  const isMember = members.some(
    m => m.user_id === user_id && m.is_active
  );
  console.log("isMember:",isMember)
  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }

  // ❌ ไม่ต้อง clear ก่อน
  // await voteModel.clearBudgetCategory(...);

  // 4. Update budget (state + log)
  const result = await voteModel.updateBudget(
    trip.trip_id,
    user_id,
    category,
    amount
  );

  return {
    success: true,
    old_amount: result.old_amount,
    new_amount: result.new_amount,
    message: "Budget updated successfully"
  };
};


/*
* ดึงข้อมูลสำหรับอัปเดตงบประมาณของตัวเอง
*/
export const getUserBudgetForTrip = async (tripid: string, user_id: string) => {
  // 1. หาทริป
  const trip = await tripModel.findTripById(tripid);
  console.log("Trip found for budget retrieval", trip);
  if (!trip) throw new Error("Trip not found");

  // 2. เช็คว่าเป็นสมาชิกหรือไม่
  const members = await tripModel.getTripMembers(trip.trip_id);
  console.log("Trip members:", members);

  const isMember = members.some(m => m.user_id === user_id && m.is_active);
  console.log(`Is user ${user_id} a member?`, isMember);
  
  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }
 
  // 3. ดึงงบประมาณของ user
  const budgets = await voteModel.getBudgetOptionByUserId(trip.trip_id, user_id);

  if (!budgets || budgets.length === 0) {
    console.log("No budget votes yet");
    return null;
  }

  const budgetObj: any = {
    accommodation: 0,
    transport: 0,
    food: 0,
    other: 0
  };

  budgets.forEach((b: any) => {
    budgetObj[b.category_name] = Number(b.estimated_amount);
  });

  console.log("User Budget for Trip", budgetObj);
  return budgetObj;
}

// ===================== LOCATION VOTING =====================

/**
 * 6. โหวตจังหวัด (Ranked Voting: 3 อันดับ)
 */
export const voteLocation = async ( tripid: string, user_id: string,votes: LocationVotePayload[] ) => {
  // 1. Validate
  if (!Array.isArray(votes) || votes.length !== 3) {
    throw new Error("Must vote for exactly 3 provinces");
  }
  console.log("trip id votelocatio:",tripid)
  console.log("user id votelocation",user_id)
  const uniqueVotes = new Set(votes);
  if (uniqueVotes.size !== 3) {
    throw new Error("Must vote for 3 different provinces");
  }

  // 2. หาทริป
  const trip = await tripModel.findTripById(tripid);
  console.log("trip:",trip)
  if (!trip) throw new Error("Trip not found");

  // 3. เช็คสมาชิก
  const members = await tripModel.getTripMembers(trip.trip_id);
  console.log("member:",members)
  const isMember = members.some(m => m.user_id === user_id && m.is_active);
  
  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }
  await voteModel.clearLocation(tripid,user_id);

  const provinces = votes.map(v => v.place);
  const unique = new Set(provinces);
  if (unique.size !== 3) {
    throw new Error("Must vote for 3 different provinces");
  }
  // 4. บันทึกโหวต
  await voteModel.submitLocationVotes(tripid,user_id,provinces);

  // 5. ดึงคะแนนรวมล่าสุด
  const newScores = await voteModel.getLocationScores(tripid);
  console.log("scores:",newScores)

  return newScores;
};

// get location vote
export const getLocationVote = async ( tripid: string ) => {

}
/**
 * 7. ปิดการโหวต (Owner only)
 */
export const closeTrip = async (tripCode: string, user_id: string) => {
  // 1. หาทริป
  const trip = await tripModel.getTripByInviteCode(tripCode);
  if (!trip) throw new Error("Trip not found");

  // 2. เช็คว่าเป็น owner
  if (trip.owner_id !== user_id) {
    throw new Error("Only trip owner can close voting");
  }

  // 3. เปลี่ยนสถานะทริปเป็น 'confirmed'
  const connection = await voteModel.getConnection();
  try {
    await connection.beginTransaction();

    // อัปเดตสถานะทริป
    await connection.query(
      `UPDATE trips 
       SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW() 
       WHERE trip_id = ?`,
      [trip.trip_id]
    );

    // ปิดห้องโหวตทั้งหมด
    await connection.query(
      `UPDATE date_votings 
       SET status = 'closed', closed_at = NOW() 
       WHERE trip_id = ? AND status = 'active'`,
      [trip.trip_id]
    );

    await connection.query(
      `UPDATE budget_votings 
       SET status = 'closed', closed_at = NOW() 
       WHERE trip_id = ? AND status = 'active'`,
      [trip.trip_id]
    );

    await connection.query(
      `UPDATE location_votings 
       SET status = 'closed', closed_at = NOW() 
       WHERE trip_id = ? AND status = 'active'`,
      [trip.trip_id]
    );

    await connection.commit();
    
    return {
      success: true,
      message: "Trip voting closed successfully"
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default {
  submitAvailability,
  //getTripHeatmap,
  //startVotingSession,
  //getFullTripData,
  updateBudget,
  voteLocation,
  closeTrip
};

export function getBudgetVoting(tripCode: string, userId: string) {
  throw new Error('Function not implemented.');
}


import { v4 as uuidv4 } from 'uuid';
import * as voteModel from '../models/voteModel.js';
import * as tripModel from '../models/tripModel.js';



export interface DateRange {
    start_date: string;
    end_date: string;
}

export interface HeatmapData {
    [date: string]: string[];
}

type AvailabilitySet = {
  user_id: string;
  dates: string[]; // ["2025-12-01","2025-12-02",...]
}

// ===================== DATE VOTING =====================

function buildDateRanges(dates: string[]): DateRange[] {
  const sorted: string[] = [...new Set(dates)].sort();
  const ranges: DateRange[] = [];

  if (sorted.length === 0) return [];

  let start = sorted[0]!;
  let end = sorted[0]!;

  for (let i = 1; i < sorted.length; i++) {
    const prev: Date = new Date(sorted[i - 1]!);
    const curr: Date = new Date(sorted[i]!);

    const diff = (curr.getTime() - prev.getTime()) / 86400000;

    if (diff === 1) {
      end = sorted[i]!;
    } else {
      ranges.push({ start_date: start, end_date: end });
      start = end = sorted[i]!;
    }
  }

  ranges.push({ start_date: start, end_date: end });
  return ranges;
}

/**
 * 1. บันทึกวันว่างของ User
 */
export const submitAvailability = async ( trip_id: string, user_id: string, dates?: string[] ) => {
   // ยังไม่โหวต
  if (dates === undefined) return;

  // clear ของเดิม
  await voteModel.clearUserAvailability(trip_id, user_id);

  // ไม่มีวันว่าง
  if (dates.length === 0) return;

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
export const getTripHeatmap = async (trip_id: string): Promise<HeatmapData> => {
  const rawData = await voteModel.getTripAvailabilities(trip_id);
  
  const heatmap: HeatmapData = {};

  rawData.forEach((entry: any) => {
    let current = new Date(entry.start_date);
    const end = new Date(entry.end_date);

    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10); // "2025-12-25"

      if (!heatmap[dateStr]) {
        heatmap[dateStr] = [];
      }

      if (!heatmap[dateStr].includes(entry.user_id)) {
        heatmap[dateStr].push(entry.user_id);
      }

      current.setDate(current.getDate() + 1);
    }
  });

  return heatmap;
};

/**
 * 3. เปิดห้องโหวต + เปลี่ยนสถานะทริปเป็น 'voting'
 */
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

export const getTripDateMatchingResult = async (tripId: string) => {

  const rows = await voteModel.getAvailabilitiesByTrip(tripId);
  const totalMembers = await voteModel.getActiveMemberCount(tripId);

  // ไม่มี member หรือไม่มี availability
  if (!rows || rows.length === 0 || totalMembers === 0) {
    return {
      intersection: [],
      weighted: [],
      totalMembers: totalMembers ?? 0
    };
  }

  const availabilitySets: { user_id: string; dates: string[] }[] = rows.map(r => ({
    user_id: r.user_id,
    dates: expandDateRange(r.start_date, r.end_date)
  }));

  // Intersection
  let intersection = availabilitySets?.[0]?.dates ?? [];
  for (let i = 1; i < availabilitySets.length; i++) {
    const dates = availabilitySets?.[i]?.dates ?? [];
    intersection = intersection.filter(d => dates.includes(d));
  }

  // Weighted Scoring
  const scoreMap: Record<string, number> = {};
  for (const set of availabilitySets) {
    for (const d of set.dates) {
      scoreMap[d] = (scoreMap[d] || 0) + 1;
    }
  }

  const weighted = Object.entries(scoreMap)
    .map(([day, count]) => ({
      day,
      freeMembers: count,
      score: (count / totalMembers) * 100
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    intersection,
    weighted,
    totalMembers
  };
};

// helper
function expandDateRange(start: string, end: string): string[] {
  const s = new Date(start);
  const e = new Date(end);
  const dates: string[] = [];
  
  while (s <= e) {
    dates.push(s.toISOString().slice(0, 10));
    s.setDate(s.getDate() + 1);
  }
  return dates;
}



// ===================== BUDGET VOTING =====================

/**
 * 4. ดึงข้อมูลทริปทั้งหมด (สำหรับหน้า Vote)
 */
export const getFullTripData = async (tripCode: string) => {
  // 1. หาทริปจาก invite_code
  const trip = await tripModel.getTripByInviteCode(tripCode);
  if (!trip) throw new Error("Trip not found");
  
  const trip_id = trip.trip_id;
  
  // 2. ดึงข้อมูลทั้งหมด
  const [members, budgets, locationScores, availabilities] = await Promise.all([
    tripModel.getTripMembers(trip_id),
    voteModel.getTripBudgets(trip_id),
    voteModel.getLocationScores(trip_id),
    voteModel.getTripAvailabilities(trip_id)
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

/**
 * 5. อัปเดตงบประมาณ
 */
export const updateBudget = async (
  tripCode: string,
  user_id: string,
  category: string,
  amount: number
) => {
  // 1. Validate
  const validCategories = ['accommodation', 'transport', 'food', 'other'];
  if (!validCategories.includes(category)) {
    throw new Error("Invalid category");
  }

  if (amount < 0) {
    throw new Error("Amount must not be negative");
  }

  // 2. หาทริป
  const trip = await tripModel.getTripByInviteCode(tripCode);
  if (!trip) throw new Error("Trip not found");

  // 3. เช็คว่าเป็นสมาชิกหรือไม่
  const members = await tripModel.getTripMembers(trip.trip_id);
  const isMember = members.some(m => m.user_id === user_id && m.is_active);
  
  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }

  // 4. Update budget
  const result = await voteModel.upsertBudget(trip.trip_id, user_id, category, amount);

  return {
    success: true,
    old_amount: result.old_amount,
    new_amount: result.new_amount,
    message: "Budget updated successfully"
  };
};

// ===================== LOCATION VOTING =====================

/**
 * 6. โหวตจังหวัด (Ranked Voting: 3 อันดับ)
 */
export const voteLocation = async (
  tripCode: string,
  user_id: string,
  votes: string[]
) => {
  // 1. Validate
  if (!Array.isArray(votes) || votes.length !== 3) {
    throw new Error("Must vote for exactly 3 provinces");
  }

  const uniqueVotes = new Set(votes);
  if (uniqueVotes.size !== 3) {
    throw new Error("Must vote for 3 different provinces");
  }

  // 2. หาทริป
  const trip = await tripModel.getTripByInviteCode(tripCode);
  if (!trip) throw new Error("Trip not found");

  // 3. เช็คสมาชิก
  const members = await tripModel.getTripMembers(trip.trip_id);
  const isMember = members.some(m => m.user_id === user_id && m.is_active);
  
  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }

  // 4. บันทึกโหวต
  await voteModel.submitLocationVotes(trip.trip_id, user_id, votes);

  // 5. ดึงคะแนนรวมล่าสุด
  const newScores = await voteModel.getLocationScores(trip.trip_id);

  return newScores;
};

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
  getTripHeatmap,
  startVotingSession,
  getFullTripData,
  updateBudget,
  voteLocation,
  closeTrip
};


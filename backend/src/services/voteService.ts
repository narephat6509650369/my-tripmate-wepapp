import { v4 as uuidv4 } from 'uuid';
import * as voteModel from '../models/voteModel.js';
import * as tripModel from '../models/tripModel.js';

export interface DateRange {
    available_date: string;
}

export interface DateWeight {
  day: string,
  freeMembers: number,
  score: number
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
export const getTripDateMatchingResult = async (tripId: string,userId: string) => {
  //หาวันว่างสำหรับ user คนนั้น get row กัย rowlog วันว่างทั้งหมด ที่ user คนนั้นเลือกจะ return ดึงจากตาราง date_votes กับ rowlog แสดงค่าท้ังหมดการเลือกทุอย่างของ user ทุกคนใน 1 trip
  const userAvailabilityRows = await voteModel.getTripAvailabilities(tripId, userId);
  const availabilities = await voteModel.getAvailabilitiesByTrip(tripId);
  const totalMembers = await voteModel.getActiveMemberCount(tripId);
  const trip = await tripModel.findTripById(tripId);
  const tripDuration = trip.num_days;
  
  if (!trip) {
    throw new Error("Trip not found");
  }

  if (tripDuration == null) {
    throw new Error("Trip duration is missing");
  }



  if (!availabilities.length || totalMembers === 0) {
    return {
      userAvailabilityRows,
      table: {},
      intersection: [],
      weighted: [],
      bestMatch: null,
      totalMembers
    };
  }


  //1. Build table + weight
  type DateTable = Record<string, string[]>;
  type DateWeight = Record<string, number>;

  const table: DateTable = {};
  const weight: DateWeight = {};

  for (const row of availabilities) {
    if (!row.available_date) continue;

    const day = new Date(row.available_date)
    .toISOString()
    .split("T")[0]; // YYYY-MM-DD

    if (!day) continue;

    table[day] ??= [];
    table[day].push(row.user_id);
  }

  for (const day in table) {
    const users = table[day];
    if (!users) continue;
    weight[day] = users.length;
  }

  // 2. Intersection (100%)
  const intersection = Object.keys(weight)
    .filter(day => weight[day] === totalMembers)
    .sort();

  
  // 3. Weighted list (for UI)
  //เอาจำนวนวันที่ซ้ำมาคำนวณเป็นคะแนน
  const weighted = Object.entries(weight)
    .map(([day, count]) => ({
      day,
      freeMembers: count,
      score: Math.round((count / totalMembers) * 100)
    }))
    .sort((a, b) => b.score - a.score);

  // 4. Helper functions
  //ตำนวณอะไร แล้ว return เป็น true false
  const isConsecutive = (dates: string[]) => {
  for (let i = 1; i < dates.length; i++) {
    const current = dates[i];
    const previous = dates[i - 1];

    if (!current || !previous) return false;

    const diff =
      (new Date(current).getTime() - new Date(previous).getTime()) /
      86400000;

    if (diff !== 1) return false;
    }
    return true;
   };

  //เหมือนหน้าที่จะซ้ำกะ weight รึป้าว
  const scoreRange = (dates: string[]) => {
    const totalPeople = dates.reduce((s, d) => s + (weight[d] ?? 0), 0);
    const avgPeople = totalPeople / dates.length;

    const diff = Math.abs(dates.length - tripDuration);
    const lengthScore =
      diff === 0 ? 500 :
      diff === 1 ? 300 :
      Math.max(0, 100 - diff * 30);

    const consecutiveBonus = isConsecutive(dates) ? 200 : 0;

    return {
      dates,
      avgPeople: Math.round(avgPeople * 10) / 10,
      score: Math.round(avgPeople * 100 + lengthScore + consecutiveBonus),
      isConsecutive: isConsecutive(dates)
    };
  };
  //หาระยะระหว่างที่ใกล้ใน กรณีที่ไม่มีbestmatch ไม่ควรreturn แค่คะแนนนะควร return date ด้วย เพื่อแสดงเป็น score ใกล้กันมากสุดโดยอิงจกวันที่ว่าง tripduration 
  const findBestRange = async () => {
    const days = Object.keys(weight).sort();
  
    if (!days.length) return null;

    let best: ReturnType<typeof scoreRange> | null = null;

    for (
      let size = tripDuration;
      size >= Math.max(1, tripDuration - 2);
      size--
    ) {
      for (let i = 0; i <= days.length - size; i++) {
        const range = days.slice(i, i + size);
        const result = scoreRange(range);

        if (!best || result.score > best.score) {
          best = result;
        }
      }
    }
    return best;
  };

 
  //5. Decision Flow
  let bestMatch = null;

  // 5.1 Perfect consecutive intersection if intersection มากกว่า 1
  for (let i = 0; i <= intersection.length - tripDuration; i++) {
    const range = intersection.slice(i, i + tripDuration);
    if (isConsecutive(range)) {
      bestMatch = scoreRange(range);
      console.log("best match:",bestMatch)
      break;
    }
  }

  // 5.2 Fallback เก็บตกอันนี้มาเพื่อถ้าไม่ intersect กันเลยจะแสดง findBestRenge
  if (!bestMatch) {
    bestMatch =await findBestRange();
  }

  return {
    userAvailabilityRows,
    table,
    intersection,
    weighted,
    bestMatch,
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
  
  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }

  //clear ก่อน
  await voteModel.clearBudgetCategory(tripid,user_id,category);

  // 4. Update budget (state + log)
  const result = await voteModel.updateBudget(
    trip.trip_id,
    user_id,
    category,
    amount
  );

  return {
    success: true,
    message: "Budget updated successfully"
  };
};

/*
* ดึงข้อมูลสำหรับอัปเดตงบประมาณของตัวเอง
*/
export const getUserBudgetForTrip = async (tripid: string, user_id: string) => {

  const trip = await tripModel.findTripById(tripid);
  if (!trip) throw new Error("Trip not found");

  const members = await tripModel.getTripMembers(trip.trip_id);

  const isMember = members.some(
    m => m.user_id === user_id && m.is_active
  );

  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }

  const result = await voteModel.getBudgetVoting(trip.trip_id, user_id);

  if (!result) {
    return {
        rows: [],
        stats: {},
        filledMembers: 0,
        rowlog: []
    };
  }

  const { rows, rowlog , budgetcount, budget} = result;
  

  // 1 จัดกลุ่ม vote ล่าสุด (จาก budget_votes)
  const categoryMap: Record<string, number[]> = {};
  const userSet = new Set<string>();

  (budget as any[]).forEach((vote: any) => {
    const category = vote.category_name;
    const amount = Number(vote.estimated_amount);
    console.log("vote:",vote);

    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }

    categoryMap[category].push(amount);
    userSet.add(vote.user_id);
  });

  // 2 Helper: Quartile + IQR 

  const calculateQuartile = (sorted: number[], q: number): number => {
    if (sorted.length === 0) return 0;

    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    const baseValue = sorted[base] ?? 0;
    const nextValue = sorted[base + 1] ?? baseValue;

    return baseValue + rest * (nextValue - baseValue);
  };


  const filterOutliers = (data: number[]) => {
  if (data.length === 0) {
    return {
      filtered: [],
      removed: [],
      quartile: {
        q1: 0,
        q2: 0,
        q3: 0,
        iqr: 0,
        lowerBound: 0,
        upperBound: 0
      }
    };
  }

  const sorted = [...data].sort((a, b) => a - b);

  const q1 = calculateQuartile(sorted, 0.25);
  const q2 = calculateQuartile(sorted, 0.5);
  const q3 = calculateQuartile(sorted, 0.75);
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const filtered = sorted.filter(
    x => x >= lowerBound && x <= upperBound
  );

  const removed = sorted.filter(
    x => x < lowerBound || x > upperBound
  );

  return {
    filtered,
    removed,
    quartile: { q1, q2, q3, iqr, lowerBound, upperBound }
  };
};


  // 3️ คำนวณสถิติ

  const stats: any = {};
  let budgetTotal = 0;
  let minTotal = 0;
  let maxTotal = 0;

  for (const category in categoryMap) {

    const amounts = categoryMap[category] ?? [];
    const { filtered, removed, quartile } = filterOutliers(amounts);

    if (quartile.q1 === 0 && quartile.q2 === 0 && quartile.q3 === 0) {
      stats[category] = { q1: 0, q2: 0, q3: 0, iqr: 0, lowerBound: 0, upperBound: 0, filteredCount: 0, removedCount: 0, removedValues: [] };
      continue;
    }

    stats[category] = {
      q1: quartile.q1,
      q2: quartile.q2,
      q3: quartile.q3,
      iqr: quartile.iqr,
      lowerBound: quartile.lowerBound,
      upperBound: quartile.upperBound,
      filteredCount: filtered.length,
      removedCount: removed.length,
      removedValues: removed
    };
    // รวมงบประมาณทั้งหมด (ใช้ค่า Q2)
    budgetTotal += quartile.q2;
    minTotal += quartile.q1;
    maxTotal += quartile.q3;
   
  };

  //เผื่อปัดเศษ
  budgetTotal = Math.round(budgetTotal);
  minTotal = Math.round(minTotal);
  maxTotal = Math.round(maxTotal);

  return {
      rows,
      stats,
      budgetTotal,
      minTotal,
      maxTotal,
      filledMembers: userSet.size,
      rowlog
  };
};


// ===================== LOCATION VOTING =====================

/**
 * 6. โหวตจังหวัด (Ranked Voting: 3 อันดับ)
 */
export const voteLocation = async (
  tripid: string,
  user_id: string,
  votes: LocationVotePayload[]
) => {
  // 1. Validate จำนวน
  if (!Array.isArray(votes) || votes.length !== 3) {
    throw new Error("Must vote for exactly 3 provinces");
  }

  // 2. Validate จังหวัดไม่ซ้ำ
  const provinces = votes.map(v => v.place);
  const unique = new Set(provinces);
  if (unique.size !== 3) {
    throw new Error("Must vote for 3 different provinces");
  }

  // 3. หาทริป
  const trip = await tripModel.findTripById(tripid);
  if (!trip) {
    throw new Error("Trip not found");
  }

  // 4. เช็คสมาชิก
  const members = await tripModel.getTripMembers(trip.trip_id);
  const isMember = members.some(
    m => m.user_id === user_id && m.is_active
  );

  if (!isMember) {
    throw new Error("You are not a member of this trip");
  }

  // 5. บันทึกโหวต (ส่ง payload เต็ม)
  await voteModel.submitLocationVotes(tripid, user_id, votes);

  // 6. ดึงคะแนนรวมล่าสุด
  return await voteModel.getLocationScores(tripid);
};


// get location vote
export const getLocationVote = async ( tripId: string ) => {
  const location = await voteModel.getVoteLocation(tripId);
  return location ;
}

/*ปิดทริป
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
*/
export default {
  submitAvailability,
  //getTripHeatmap,
  //startVotingSession,
  //getFullTripData,
  updateBudget,
  voteLocation,
  //closeTrip
};

export function getBudgetVoting(tripCode: string, userId: string) {
  throw new Error('Function not implemented.');
}


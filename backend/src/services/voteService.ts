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

export const checkTripStatus = async (tripId: string) => {
  const trip = await tripModel.findTripById(tripId);
  if (!trip) throw new Error("Trip not found");

  return trip.status;
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
export const getvoteDate = async (tripId: string,userId: string) => {

  const trip = await tripModel.findTripById(tripId);
  if (!trip) throw new Error("Trip not found");

  if (trip.num_days == null) {
    throw new Error("Trip duration is missing");
  }

  const tripDuration = trip.num_days;

  const {rows, rowlog,countrows} = await voteModel.getTripAvailabilities(tripId, userId);
  const availabilities = await voteModel.getAvailabilitiesByTrip(tripId);
  const totalMembers = await voteModel.getActiveMemberCount(tripId);

  if (!availabilities.length || totalMembers === 0) {
    return {
      rows: [],
      summary: { totalMembers, totalAvailableDays: 0 },
      availability: {},
      recommendation: null,
      rowlog: []
    };
  }

  // 1️ สร้างตาราง availability table วัน+user_id

  const table: Record<string, string[]> = {};

  for (const row of availabilities) {
    const day = new Date(row.available_date)
      .toISOString()
      .split("T")[0];

    if (!day) continue;

    table[day] ??= [];
    table[day].push(row.user_id);
  }

  // 2️ สร้างตาราง weigth วัน+จำนวนคนว่าง

  const weight: Record<string, number> = {};

  for (const day in table) {
    weight[day] = table[day]?.length ?? 0;
  }

  
/*// 3️ หา Intersection (100%) วันที่ทุกคนว่าง 
  const intersection = Object.keys(weight)
    .filter(day => weight[day] === totalMembers)
    .sort();
*/
  // 4️ Weighted list แสดงวันททีี่คนว่าง + เปอร์เซ็นต์ 

  const rankedDays = Object.entries(weight)
    .map(([day, count]) => ({
      date: day,
      count,
      percentage: Math.round((count / totalMembers) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // 5️ Helper

  const isConsecutive = (dates: string[]) => {
    for (let i = 1; i < dates.length; i++) {
      const diff =
        (new Date(dates[i]!).getTime() -
          new Date(dates[i - 1]!).getTime()) /
        86400000;

      if (diff !== 1) return false;
    }
    return true;
  };

// Score Range Function คำนวณคะแนนช่วงวัน
  const scoreRange = (dates: string[]) => {
    const totalPeople = dates.reduce(
      (sum, d) => sum + (weight[d] ?? 0),
      0
    );

    const avgPeople = totalPeople / dates.length;
    const availabilityScore = avgPeople / totalMembers; // 0–1

    const lengthDiff = Math.abs(dates.length - tripDuration);
    const lengthScore = Math.max(0, 1 - lengthDiff * 0.3);

    const consecutiveBonus = isConsecutive(dates) ? 0.1 : 0;

    const finalScore =
      (availabilityScore * 0.7 +
        lengthScore * 0.2 +
        consecutiveBonus) *
      100;

    return {
      dates,
      avgPeople: Math.round(avgPeople * 10) / 10,
      percentage: Math.round(availabilityScore * 100),
      score: Math.round(finalScore),
      isConsecutive: isConsecutive(dates)
    };
  };

  // 6️ Find Best Range หาวันที่เหมาะสมที่สุด

  const days = Object.keys(weight).sort();
  let bestMatch: ReturnType<typeof scoreRange> | null = null;

  for (let size = tripDuration; size >= 1; size--) {
    for (let i = 0; i <= days.length - size; i++) {
      const range = days.slice(i, i + size);
      const result = scoreRange(range);

      if (!bestMatch || result.score > bestMatch.score) {
        bestMatch = result;
      }
    }
  }

  return {
  rows, 
  countrows,  
  summary: {
      totalMembers,
      totalAvailableDays: Object.keys(table).length
  },
  availability: rankedDays,
  recommendation: bestMatch, // หรือจะทำ unique voter count ก็ได้
  rowlog
};
};

// ===================== BUDGET VOTING =====================

/**
 * 5. อัปเดตงบประมาณ
 */
export const updateBudget = async ( tripid: string,user_id: string,category: string,amount: number ) => {
  try{
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
  } catch (error) {
    console.error("Budget update error:", error instanceof Error ? error.message : error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred while updating budget"
    };
  }
};

/*
* ดึงข้อมูลสำหรับอัปเดตงบประมาณของตัวเอง
*/
export const getvoteBudget = async (tripid: string, user_id: string) => {

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
    //console.log("vote:",vote);

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
const PROVINCE_REGIONS: Record<string, string[]> = {
  'ภาคเหนือ': ['เชียงใหม่','เชียงราย','ลำปาง','ลำพูน','แม่ฮ่องสอน','น่าน','พะเยา','แพร่','อุตรดิตถ์'],
  'ภาคตะวันออกเหนือ': [
    'นครราชสีมา','บุรีรัมย์','สุรินทร์','ศรีสะเกษ','อุบลราชธานี',
    'ยโสธร','ชัยภูมิ','อำนาจเจริญ','หนองบัวลำภู','ขอนแก่น',
    'อุดรธานี','เลย','หนองคาย','มหาสารคาม','ร้อยเอ็ด',
    'กาฬสินธุ์','สกลนคร','นครพนม','มุกดาหาร','บึงกาฬ'
  ],
  'ภาคกลาง': [
    'กรุงเทพมหานคร','นนทบุรี','ปทุมธานี','สมุทรปราการ',
    'นครปฐม','สมุทรสาคร','สมุทรสงคราม','พระนครศรีอยุธยา',
    'อ่างทอง','ลพบุรี','สิงห์บุรี','ชัยนาท','สระบุรี',
    'ฉะเชิงเทรา','ปราจีนบุรี','นครนายก','สุพรรณบุรี',
    'กาญจนบุรี','ราชบุรี','เพชรบุรี','ประจวบคีรีขันธ์'
  ],
  'ภาคตะวันออก': ['ชลบุรี','ระยอง','จันทบุรี','ตราด','สระแก้ว'],
  'ภาคใต้': [
    'นครศรีธรรมราช','กระบี่','พังงา','ภูเก็ต','สุราษฎร์ธานี',
    'ระนอง','ชุมพร','สงขลา','สตูล','ตรัง','พัทลุง',
    'ปัตตานี','ยะลา','นราธิวาส'
  ],
  'ภาคตะวันตก': [
    'ตาก','กำแพงเพชร','พิษณุโลก','สุโขทัย','พิจิตร',
    'เพชรบูรณ์','นครสวรรค์','อุทัยธานี'
  ]
};

const getRegion = (province: string): string => {
  for (const [region, provinces] of Object.entries(PROVINCE_REGIONS)) {
    if (provinces.includes(province)) return region;
  }
  return 'ไม่ระบุภูมิภาค';
};

 // 6. โหวตจังหวัด (Ranked Voting: 3 อันดับ)
export const voteLocation = async (tripid: string,user_id: string,votes: LocationVotePayload[]) => {
  // 1. Validate จำนวน
  if (!Array.isArray(votes) || votes.length !== 3) {
    throw new Error("Must vote for exactly 3 provinces");
  }

  // 2. Validate จังหวัดไม่ซ้ำ
  const provinces = votes.map(v => v.place );

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
export const getvoteLocation = async (tripId: string, user_id: string) => {
  const { rows, rowlog, locationVotesTotal } = await voteModel.getVoteLocation(tripId, user_id);

  if (!Array.isArray(locationVotesTotal) || locationVotesTotal.length === 0) {
    return {
      rows,
      analysis: null,
      rowlog,
      locationVotesTotal: []
    };
  }

  const provinceScores = locationVotesTotal
    .map((r: any) => ({
      place: r.place,
      region: getRegion(r.place),
      total_score: Number(r.total_score),
      voteCount: Number(r.vote_count),
      rank1Count: Number(r.rank_1)
    }))
    .sort((a, b) =>
      b.total_score - a.total_score ||   // คะแนนรวม (3-2-1) 
      b.rank1Count - a.rank1Count ||     // //จำนวน คน ที่ให้จังหวัดนั้นเป็นอันดับ 1
      b.voteCount - a.voteCount          // จำนวนคนโหวตให้จังหวัดนั้น (ไม่สนอันดับ)
    );

  const first = provinceScores[0];
  const second = provinceScores[1];

  const hasDistinctWinner =
    provinceScores.length === 1 ||
    (first && second && (
      first.total_score > second.total_score ||
      (
        first.total_score === second.total_score &&
        first.rank1Count > second.rank1Count
      ) ||
      (
        first.total_score === second.total_score &&
        first.rank1Count === second.rank1Count &&
        first.voteCount > second.voteCount
      )
    ));

  let analysis: any = null;

  if (hasDistinctWinner) {
    analysis = {
      hasWinner: true,
      winner: first,
      topProvinces: provinceScores.slice(0, 3)
    };
  } else {

    // ไม่มีผู้ชนะที่ชัดเจน ให้วิเคราะห์ระดับภูมิภาคต่อ (รวมคะแนนตามภูมิภาค)

    const regionScores: Record<string, any> = {};

    provinceScores.forEach(p => {
      if (!regionScores[p.region]) {
        regionScores[p.region] = {
          totalScore: 0,
          rank1Count: 0,
          voteCount: 0,
          provinces: new Set<string>()
        };
      }

      regionScores[p.region].totalScore += p.total_score;
      regionScores[p.region].rank1Count += p.rank1Count;
      regionScores[p.region].voteCount += p.voteCount;
      regionScores[p.region].provinces.add(p.place);
    });

    const sortedRegions = Object.entries(regionScores).sort(
      ([regionA, a]: any, [regionB, b]: any) =>
        b.totalScore - a.totalScore ||
        b.rank1Count - a.rank1Count ||
        b.voteCount - a.voteCount ||
        b.provinces.size - a.provinces.size ||
        regionA.localeCompare(regionB, 'th')
    );

    const [bestRegion, data]: any = sortedRegions[0];

    analysis = {
      hasWinner: false,
      bestRegion: {
        region: bestRegion,
        topProvinces: provinceScores
          .filter(p => p.region === bestRegion)
          .slice(0, 3),
        provinces: Array.from(data.provinces),
        totalScore: data.totalScore,
        rank1Count: data.rank1Count,
        voteCount: data.voteCount,
        diversity: data.provinces.size
      }
    };
  }

  return {
    rows,
    analysis,
    locationVotesTotal: provinceScores,
    rowlog
  };
};


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
  getvoteDate,
  getvoteBudget,
  getvoteLocation,
  checkTripStatus
  //closeTrip
};









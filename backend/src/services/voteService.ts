import { v4 as uuidv4 } from 'uuid';
import * as voteModel from '../models/voteModel.js';
import * as tripModel from '../models/tripModel.js';
import { pool } from '../config/db.js';

export interface DateRange {
    start_date: string;
    end_date: string;
}

export interface HeatmapData {
    [date: string]: string[];
}

// ===================== DATE VOTING =====================

/**
 * 1. บันทึกวันว่างของ User
 */
export const submitAvailability = async (
  trip_id: string, 
  user_id: string, 
  ranges: DateRange[]
) => {
  // Validate
  if (!ranges || ranges.length === 0) {
    throw new Error("ranges must not be empty");
  }

  // Validate date ranges
  for (const range of ranges) {
    if (new Date(range.start_date) > new Date(range.end_date)) {
      throw new Error(`Invalid date range: ${range.start_date} to ${range.end_date}`);
    }
  }

  // 1. ลบวันว่างเก่าทิ้ง
  await voteModel.clearUserAvailability(trip_id, user_id);

  // 2. บันทึกวันว่างใหม่
  const insertPromises = ranges.map(range => 
    voteModel.addAvailability(trip_id, user_id, range.start_date, range.end_date)
  );
  
  await Promise.all(insertPromises);
  
  return { success: true, message: "Availability saved" };
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO date_votings (date_voting_id, trip_id, status) 
       VALUES (?, ?, 'active')`,
      [date_voting_id, trip_id]
    );

    await connection.query(
      `UPDATE trips SET status = 'voting', updated_at = NOW() 
       WHERE trip_id = ?`,
      [trip_id]
    );

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
  const connection = await pool.getConnection();
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


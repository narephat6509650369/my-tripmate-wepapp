import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface Trip {
    trip_id: string;
    owner_id: string;
    trip_name: string;
    description?: string | null;
    num_days: number;
    invite_code: string;
    invite_link: string;
    status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived';
    created_at?: Date;
    updated_at?: Date;
    confirmed_at?: Date | null;
    is_active?: boolean;
}

export interface TripData {
  trip_id: string;
  tripCode: string;
  inviteCode?: string;
  inviteLink?: string;
  name: string;
  days: number;
  detail: string;
  status?: string;
  createdAt: number;
  members: MemberTrip[];
  voteOptions: {
    dateOptions: {
      startDate: string;
      endDate: string;
    }[];
    locationOptions: {
      location_option_id: string;
      province_name: string;
    }[];
    budgetOptions: {
      category_name: string;
      estimated_amount: number;
      is_backup: boolean;
    }[];
  }

}

export interface MemberTrip {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'member';
}

export interface TripMember extends RowDataPacket{
    member_id: string;
    trip_id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at?: Date;
    is_active?: boolean;
}

export interface TripDashboardItem {
    trip_id: string;
    trip_name: string;
    status: string;        // planning, voting, etc.
    role: 'owner' | 'member';
    num_members: number;   // จำนวนคนในทริป
    days_left: number;     // (Optional) เหลืออีกกี่วันจะถึงวันไป
    created_at: Date;
}

export interface TripSummary extends RowDataPacket {
    trip_id: string;
    trip_name: string;
    status: string;
    role: 'owner' | 'member'; // สำคัญมาก เอาไว้แยก Tab หน้าบ้าน
    num_members: number;
}

export interface MyTrip {
    trip_id: string;
    trip_name: string;
    owner_id: string;
    status: string;
    created_at: Date;
    num_members: number;
    days_left_7: number;
}

export interface DateRange {
    id: string;
    user_id: string;
    dates: Date[];
    created_at: Date;
}

export interface Date{
    start: string;
    end: string;
}
export interface TripDetail extends RowDataPacket {
    tripid: string;
    ownerid: string;
    tripname: string;
    description: string | null;
    numdays: number;
    invitecode: string;
    invitelink: string;
    status: string;
    createdat: Date;
    membercount: number;
    members?: TripMember[];
    dateRanges?: DateRange[];
    provinceVotes?: {
        province_name: string;
        score: number;
    }[];
    budgetOptions?: {
        category_name: string;
        estimated_amount: number;
        is_backup: boolean;
    }[];
    memberAvailabilitys?: {
        id: string;
        user_id: string;
        full_name: string;
        available_date: string;
        created_at: Date;
    }[];
}

export interface TripSummaryMember extends RowDataPacket {
  user_id: string;
  role: 'owner' | 'member';
  full_name: string;
  avatar_url: string | null;
}

export interface TripSummaryResult {
  trip: any;
  members: TripSummaryMember[];
  totalmembers?: number;
}


export async function createTripWithMember( tripData: Trip, member_id: string ): Promise<void> {
    const connection = await pool.getConnection(); // ขอ Connection แยกมาเพื่อทำ Transaction

    try {
        await connection.beginTransaction(); // เริ่มต้น Transaction

        // 1. สร้าง Trip
        await connection.query(
            'INSERT INTO trips (trip_id, owner_id, trip_name, description, num_days, invite_code, invite_link, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                tripData.trip_id, 
                tripData.owner_id, 
                tripData.trip_name, 
                tripData.description, 
                tripData.num_days, 
                tripData.invite_code, 
                tripData.invite_link, 
                tripData.status
            ]
        );

        // 2. สร้าง Member (Owner)
        // Hardcode role='owner' และ is_active=1 ได้เลย เพราะฟังก์ชันนี้ใช้ตอนสร้างทริปใหม่เท่านั้น
        await connection.query(
            'INSERT INTO trip_members (member_id, trip_id, user_id, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [member_id, tripData.trip_id, tripData.owner_id, 'owner', 1]
        );

        await connection.commit(); // บันทึกจริงเมื่อผ่านทั้งคู่
    } catch (error) {
        await connection.rollback(); // ย้อนกลับถ้ามีอะไรพัง
        throw error; // ส่ง error กลับไปให้ Controller
    } finally {
        connection.release(); // คืน Connection เสมอ
    }
}

export async function findAllTripsByUserId(user_id: string): Promise<TripSummary[]> {
    // Query นี้จะ Join ตาราง trips กับ trip_members
    // เพื่อหาทุกทริปที่ user_id นี้มีชื่ออยู่ในสมาชิก
    const sql = `
        SELECT 
            t.trip_id, 
            t.trip_name, 
            t.status, 
            tm.role,
            (SELECT COUNT(*) FROM trip_members WHERE trip_id = t.trip_id AND is_active = 1) as num_members
        FROM trips t
        JOIN trip_members tm ON t.trip_id = tm.trip_id
        WHERE tm.user_id = ? AND tm.is_active = 1
        ORDER BY t.created_at DESC
    `;
    
    const [rows] = await pool.query<TripSummary[]>(sql, [user_id]);
    return rows;
}

// ฟังก์ชันดึงเฉพาะสถานะของทริป (ใช้เช็คก่อนลบ)
export const getTripStatus = async (trip_id: string): Promise<string | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT status FROM trips WHERE trip_id = ?',
    [trip_id]
  );
  
  return rows.length > 0 ? rows[0]?.status : null;
};

export async function deleteTrip(tripId: string): Promise<void> {
    await pool.query('DELETE FROM trips WHERE trip_id = ? AND owner_id = ?', [tripId]);
}   

export async function generateInviteCode(): Promise<string> {
    let code = '';
    let isUnique = false;

    while (!isUnique) {
        const raw = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 hex chars

        // แปลงเป็น XXXX-XXXX-XXXX-XXXX
        const dashed = raw.match(/.{4}/g)!.join('-');

        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT trip_id FROM trips WHERE invite_code = ?', 
            [dashed]
        );

        if (rows.length === 0) {
            code = dashed;
            isUnique = true;
        }
    }

    return code;
}

export async function generateInviteLink(inviteCode: string): Promise<string> {
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    return `${baseUrl}/join/${inviteCode}`;
}


export const findTripById = async (tripId: string) => {
  const [rows] = await pool.execute("SELECT * FROM trips WHERE trip_id = ?", [tripId]);
  return (rows as any[])[0];
};

export const updateInviteInfo = async (tripId: string, inviteCode: string, inviteLink: string) => {
  await pool.execute(
    `UPDATE trips SET invite_code = ?, invite_link = ? WHERE trip_id = ?`,
    [inviteCode, inviteLink, tripId]
  );
};

export const findTripByInviteCode = async (inviteCode: string) => {
  const [rows] = await pool.execute(
    "SELECT * FROM trips WHERE invite_code = ?",
    [inviteCode]
  );
  return (rows as any[])[0];
};

export const addMemberIfNotExists = async (tripId: string, userId: string) => {
  try{

  const [rows] = await pool.execute(
    "SELECT * FROM trip_members WHERE trip_id = ? AND user_id = ?",
    [tripId, userId]
  );

  if ((rows as any[]).length > 0) return (rows as any[])[0];

  const role = "member";
  await pool.execute(
    `INSERT INTO trip_members (member_id, trip_id, user_id, role) VALUES (UUID(), ?, ?, ?)`,
    [tripId, userId, role]
  );

  return { trip_id: tripId, user_id: userId, role };
  } catch (error) {
    console.error("Add member error:", error instanceof Error ? error.message : error);
    throw new Error(error instanceof Error ? error.message : "An error occurred while adding member to the trip");
  }
};

//รายการทริปทั้งหมดที่ user เข้าร่วม + ถูกเชิญ + เป็นเจ้าของ
export async function getMyTrips(userId: string): Promise<MyTrip[]> {
    const sql = `
        SELECT 
            t.trip_id,
            t.trip_name,
            t.owner_id,
            t.status,
            t.created_at,
            COUNT(tm2.user_id) AS num_members,
            DATEDIFF(t.created_at + INTERVAL 7 DAY, NOW()) AS days_left_7
        FROM trips t
        JOIN trip_members tm ON tm.trip_id = t.trip_id
        LEFT JOIN trip_members tm2 ON tm2.trip_id = t.trip_id AND tm2.is_active = TRUE
        WHERE tm.user_id = ? 
          AND t.is_active = TRUE
        GROUP BY t.trip_id
        ORDER BY t.created_at DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [userId]);

    return rows as MyTrip[];   
}

// ข้อมูลทริปแบบละเอียดของทริปหนึ่ง
export async function getTripDetail(tripId: string): Promise<TripDetail | null> {
  /** 1. Trip info */
  const tripSql = `
    SELECT 
      t.trip_id,
      t.owner_id,
      t.trip_name,
      t.description,
      t.num_days,
      t.invite_code,
      t.invite_link,
      t.status,
      t.created_at,
      COUNT(tm.user_id) AS member_count
    FROM trips t
    LEFT JOIN trip_members tm 
      ON t.trip_id = tm.trip_id AND tm.is_active = 1
    WHERE t.trip_id = ?
    GROUP BY t.trip_id
  `;

  /** 2. Members */
  const memberSql = `
    SELECT
      tm.user_id AS id,
      u.full_name AS name,
      u.email,
      tm.role,
      tm.joined_at
    FROM trip_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.trip_id = ?
      AND tm.is_active = 1
  `;

  const dateRange=`
    SELECT
      availability_id AS id,
      user_id,
      available_date,
      created_at
      FROM trip_user_availabilities
    WHERE trip_id = ?
  `;

  const provinceVotes=`
    SELECT
      lo.province_name,
      COUNT(lv.location_vote_id) AS score
    FROM location_votings lvg
    JOIN location_options lo 
      ON lvg.location_voting_id = lo.location_voting_id
    LEFT JOIN location_votes lv
      ON lo.location_option_id = lv.location_option_id
    WHERE lvg.trip_id = ?
    GROUP BY lo.province_name
    ORDER BY score DESC
  `;

  const budgetOptions=`
    SELECT
      bo.category_name,
      bo.estimated_amount
    FROM budget_votings bvg
    JOIN budget_options bo
      ON bvg.budget_voting_id = bo.budget_voting_id
    WHERE bvg.trip_id = ?
  `;
  
  const MemberAvailabilitys = `
    SELECT
      tua.availability_id AS id,
      tua.user_id,
      u.full_name AS full_name,
      tua.available_date,
      tua.created_at
    FROM trip_user_availabilities tua
    JOIN users u ON tua.user_id = u.user_id
    WHERE tua.trip_id = ?
  `;

  const [tripRows] = await pool.query<any[]>(tripSql, [tripId]);
  if (tripRows.length === 0) return null;

  const [memberRows] = await pool.query<any[]>(memberSql, [tripId]);

  const [dateRows] = await pool.query<any[]>(dateRange, [tripId]);

  const [provinceRows] = await pool.query<any[]>(provinceVotes, [tripId]);
  
  const [budgetRows] = await pool.query<any[]>(budgetOptions, [tripId]);

  const [memberAvailabilityRows] = await pool.query<any[]>(MemberAvailabilitys, [tripId]);

return {
  tripid: tripRows[0].trip_id,
  ownerid: tripRows[0].owner_id,
  tripname: tripRows[0].trip_name,
  description: tripRows[0].description,
  numdays: tripRows[0].num_days,
  invitecode: tripRows[0].invite_code,
  invitelink: tripRows[0].invite_link,
  status: tripRows[0].status,
  createdat: tripRows[0].created_at,
  membercount: tripRows[0].member_count,
  members: memberRows,
  dateRanges: dateRows,
  provinceVotes: provinceRows,
  budgetOptions: budgetRows,
  memberAvailabilitys: memberAvailabilityRows,
} as TripDetail;
}

export async function findOpenTripsByUserId(userId: string): Promise<Trip[]> {
  const sql = `
    SELECT 
      t.trip_id,
      t.status
    FROM trips t
    JOIN trip_members tm ON t.trip_id = tm.trip_id
    WHERE tm.user_id = ? 
      AND tm.is_active = 1
      AND t.status IN ('planning', 'voting')
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [userId]);
  return rows as Trip[];
}

export async function groupDatesToRanges(dates: string[]): Promise<{ start: string; end: string }[]> {
  const sorted = dates.sort();
  const ranges: { start: string; end: string }[] = [];

  if (sorted.length === 0) return ranges;

  let start = sorted[0]!;
  let prev = sorted[0]!;

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (!prev) break;
    const prevDate = new Date(prev);
    prevDate.setDate(prevDate.getDate() + 1);

    if (curr === prevDate.toISOString().slice(0, 10)) {
      prev = curr;
    } else {
      ranges.push({ start, end: prev });
      start = curr!;
      prev = curr!;
    }
  }
  
  return ranges;
}


// หาสมาชิกในทริป
export const findMemberInTrip = async (trip_id: string, member_id: string) => {
  const [rows] = await pool.query<TripMember[]>(
    `SELECT * FROM trip_members WHERE trip_id = ? AND member_id = ? AND is_active = 1`,
    [trip_id, member_id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getTripMembers = async (trip_id: string) => {
  const [rows] = await pool.query<TripMember[]>(
    `SELECT * FROM trip_members WHERE trip_id = ? AND is_active = 1`,
    [trip_id]
  );
  return rows;
}
// สมาชิกที่ออกจากทริปต้องไม่สามารถเข้าถึงข้อมูลโหวต/งบ/สถานที่ได้อีก
export const removeMemberById = async (trip_id: string, member_id: string) => {
  const connection = await pool.getConnection(); // ขอ Connection แยกเพื่อทำ Transaction
  
  try {
    await connection.beginTransaction(); // เริ่มต้น Transaction

    // 1. หา user_id จาก member_id ก่อน (เพราะตาราง availability ใช้ user_id)
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT user_id FROM trip_members WHERE member_id = ? AND trip_id = ?`,
      [member_id, trip_id]
    );

    if (rows.length === 0) {
       throw new Error("Member not found");
    }
    const user_id = rows[0]?.user_id;

    // 2. Soft Delete สมาชิก (Active = 0)
    await connection.query(
      `UPDATE trip_members SET is_active = 0 WHERE trip_id = ? AND member_id = ?`,
      [trip_id, member_id]
    );

    // 3. ลบ Availability (ใช้ user_id ที่หามาได้จากข้อ 1)
    await connection.query(
       `DELETE FROM trip_user_availabilities WHERE trip_id = ? AND user_id = ?`,
       [trip_id, user_id]
    );

    await connection.commit(); // บันทึกทุกอย่าง
    return { success: true, message: "Member removed and availability cleared" };

  } catch (error) {
    await connection.rollback(); // ถ้าพัง ให้ยกเลิกทั้งหมด (Data จะไม่แหว่ง)
    throw error;
  } finally {
    connection.release(); // คืน Connection
  }
};

// หาข้อมูลทริปจาก Invite Code (สำหรับ FR2.10)
export const getTripByInviteCode = async (invite_code: string) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT trip_id, trip_name, status FROM trips WHERE invite_code = ?`,
        [invite_code]
    );
    return rows[0]; // คืนค่า undefined ถ้าหาไม่เจอ
};



// ดึงสมาชิกเก่ากลับเข้าทริป (กรณีเคยออกไปแล้ว is_active = 0)
export const reactivateTripMember = async (trip_id: string, user_id: string) => {
    await pool.query(
        `UPDATE trip_members SET is_active = 1, role = 'member' 
         WHERE trip_id = ? AND user_id = ?`,
        [trip_id, user_id]
    );
};

// ดึงข้อมูลสรุปทริป
export async function getTripSummaryById(tripId: string): Promise<TripSummaryResult | null> {
  /* 1. Trip info */
  const [tripRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      trip_id,
      trip_name,
      description,
      num_days,
      status,
      confirmed_at,
      created_at
    FROM trips
    WHERE trip_id = ?
    `,
    [tripId]
  );

  if ((tripRows as any[]).length === 0) return null;

  /* 2. Members */
  const [memberRows] = await pool.query<TripSummaryMember[]>(
    `
    SELECT 
      tm.user_id,
      tm.role,
      u.full_name,
      u.avatar_url
    FROM trip_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.trip_id = ?
      AND tm.is_active = 1
    `,[tripId]
  );

  const totalmembers = memberRows.length;

  return {
    trip: tripRows,
    members: memberRows,
    totalmembers: totalmembers
  };
}

export const updateTripStatus = async (connection: unknown, trip_id: string, status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived') => {
  await pool.query(
    'UPDATE trips SET status = ?, updated_at = NOW() WHERE trip_id = ?',
    [status, trip_id]
  );
};

export const getStatusVoteResult = async (trip_id: string) => {
  try {
    const connection = await pool.getConnection();

    const totalmembersResult = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_members FROM trip_members WHERE trip_id = ? AND is_active = 1`,
      [trip_id]
    );
    const totalMembers = totalmembersResult[0][0]?.total_members || 0;

    const [dateRows] = await connection.query<any[]>(`
      SELECT 
        COUNT(DISTINCT dv.user_id) AS total_voters
      FROM date_votes dv
      JOIN date_options do ON dv.date_option_id = do.date_option_id
      JOIN date_votings dvt ON do.date_voting_id = dvt.date_voting_id
      WHERE dvt.trip_id = ?
      GROUP BY dv.user_id
    `, [trip_id]);

    const [budgetRows] = await connection.query<any[]>(`
      SELECT 
        COUNT(DISTINCT bv.user_id) AS total_voters
      FROM budget_votes bv
      JOIN budget_options bo ON bv.budget_option_id = bo.budget_option_id
      JOIN budget_votings bvt ON bo.budget_voting_id = bvt.budget_voting_id
      WHERE bvt.trip_id = ?
      GROUP BY bv.user_id
    `, [trip_id]);

    const [locationRows] = await connection.query<any[]>(`
      SELECT 
        COUNT(DISTINCT lv.user_id) AS total_voters
      FROM location_votes lv
      JOIN location_options lo ON lv.location_option_id = lo.location_option_id
      JOIN location_votings lvt ON lo.location_voting_id = lvt.location_voting_id
      WHERE lvt.trip_id = ?
      GROUP BY lv.user_id
    `, [trip_id]);

    return {
      totalMembers,
      dateVoteNum: dateRows[0]?.total_voters ?? 0,
      budgetVoteNum: budgetRows[0]?.total_voters ?? 0,
      locationVoteNum: locationRows[0]?.total_voters ?? 0
    };

  } catch (error) {
    console.error("Error fetching vote result:", error);
    throw error;
  }
};

export const closeTrip = async (trip_id: string, type: string) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. อัปเดตสถานะตาม Type ที่ส่งมา (archived, completed, confirmed)
    await connection.query(
      `UPDATE trips SET status = ?, confirmed_at = NOW() WHERE trip_id = ?`,
      [type, trip_id]
    );

    // 2. ปิดโหวตทั้งหมด
    const tables = ['date_votings', 'budget_votings', 'location_votings'];
    for (const table of tables) {
      await connection.query(
        `UPDATE ${table} SET status = 'closed' WHERE trip_id = ?`,
        [trip_id]
      );
    }

    await connection.commit();
    return { success: true, status: type, message: `Trip closed as ${type}` };

  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release(); 
  }
};

export const getTripOwnerId = async (trip_id: string): Promise<string | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT owner_id FROM trips WHERE trip_id = ?`,
    [trip_id]
  );

  return rows.length > 0 ? rows[0]?.owner_id : null;

}

export const getTripMemberCount = async (trip_id: string): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS member_count FROM trip_members WHERE trip_id = ? AND is_active = 1`,
    [trip_id]
  );

  return rows.length > 0 ? rows[0]?.member_count : 0;
};


export default {
    generateInviteCode,
    generateInviteLink,
    getTripDetail,
    getMyTrips,
    findTripByInviteCode,
    addMemberIfNotExists,
    findMemberInTrip,
    removeMemberById,
    deleteTrip,
    createTripWithMember,
    getTripStatus,
    getTripByInviteCode,
    reactivateTripMember,
    findAllTripsByUserId,
    getTripMembers,
    findTripById,
    updateInviteInfo,
    getTripSummaryById,
    updateTripStatus,
};
/*
    getTripById,
    updateTrip,
    deactivateTrip,
    activateTrip,
    addMemberToTrip,
    removeMemberFromTrip,
    getTripMembers,
    getTripsByUserId,
    confirmTrip,
    completeTrip,
    archiveTrip,
*/
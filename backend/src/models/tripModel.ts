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

interface TripMemberWithEmail extends RowDataPacket {
  user_id: string;
  email: string;
  full_name: string;
}

interface MemberRow extends RowDataPacket {
  full_name: string;
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

export interface Member {
  member_id: string;
  trip_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
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
        `
        INSERT INTO trip_members 
          (member_id, trip_id, user_id, role, status, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [member_id,tripData.trip_id,tripData.owner_id,'owner','active',  1]
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
            (SELECT COUNT(*) FROM trip_members WHERE trip_id = t.trip_id AND is_active = 1 AND status = 'active') as num_members
        FROM trips t
        JOIN trip_members tm ON t.trip_id = tm.trip_id
        WHERE tm.user_id = ? AND tm.is_active = 1 AND tm.status = 'active'
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

export async function deleteTrip(tripId: string,ownerId: string): Promise<void> {

  await pool.query(
    'DELETE FROM trips WHERE trip_id = ? AND owner_id = ?',
    [tripId, ownerId]
  );

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

export const findMember = async (trip_id: string,user_id: string)=> {

  const [rows] = await pool.execute<MemberRow[]>(
    `
    SELECT 
      u.full_name
    FROM trip_members tm
    JOIN users u ON u.user_id = tm.user_id
    WHERE tm.trip_id = ? AND tm.user_id = ?
    LIMIT 1
    `,
    [trip_id, user_id]
  );

  return rows.length > 0 ? rows[0] : null;
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


//รายการทริปทั้งหมดที่ user เข้าร่วม + ถูกเชิญ + เป็นเจ้าของ
export async function getMyTrips(user_id: string): Promise<MyTrip[]> {

    const sql = `
        SELECT 
            t.trip_id,
            t.trip_name,
            t.owner_id,
            t.status,
            t.created_at,
            COUNT(tm2.user_id) AS num_members,
            DATEDIFF(
                DATE_ADD(t.created_at, INTERVAL 7 DAY),
                NOW()
            ) AS days_left_7
        FROM trips t
        JOIN trip_members tm 
            ON tm.trip_id = t.trip_id
            AND tm.user_id = ?
            AND tm.status = 'active'
            AND tm.is_active = TRUE
        LEFT JOIN trip_members tm2 
            ON tm2.trip_id = t.trip_id
            AND tm2.status = 'active'
            AND tm2.is_active = TRUE
        WHERE t.is_active = TRUE
        GROUP BY t.trip_id
        ORDER BY t.created_at DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [user_id]);

    return rows as MyTrip[];
}

// ข้อมูลทริปแบบละเอียดของทริปหนึ่ง
export async function getTripDetail(tripId: string): Promise<TripDetail | null> {
  try {
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
        ON t.trip_id = tm.trip_id AND tm.is_active = 1 AND tm.status = 'active'
      WHERE t.trip_id = ?
      GROUP BY t.trip_id
    `;

    const memberSql = `
      SELECT
        tm.user_id,
        u.full_name AS name,
        u.email,
        tm.role,
        tm.status,
        tm.joined_at
      FROM trip_members tm
      JOIN users u ON tm.user_id = u.user_id
      WHERE tm.trip_id = ?
        AND tm.is_active = 1
        AND tm.status = 'active'
    `;

    const dateRangeSql = `
      SELECT
        dv.date_vote_id,
        dv.user_id,
        dv.available_date,
        dv.voted_at
      FROM date_votes dv
      JOIN date_options do 
        ON dv.date_option_id = do.date_option_id
      JOIN date_votings dvt
        ON do.date_voting_id = dvt.date_voting_id
      WHERE dvt.trip_id = ?
    `;

    const provinceVotesSql = `
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

    const budgetOptionsSql = `
      SELECT
        bo.category_name,
        bo.estimated_amount
      FROM budget_votings bvg
      JOIN budget_options bo
        ON bvg.budget_voting_id = bo.budget_voting_id
      WHERE bvg.trip_id = ?
    `;

    const memberAvailabilitySql = `
      SELECT
        dv.date_vote_id AS id,
        dv.user_id,
        u.full_name,
        dv.available_date,
        dv.voted_at
      FROM date_votes dv
      JOIN users u
        ON dv.user_id = u.user_id
      JOIN date_options do
        ON dv.date_option_id = do.date_option_id
      JOIN date_votings dvt
        ON do.date_voting_id = dvt.date_voting_id
      WHERE dvt.trip_id = ?
    `;

    /** STEP 1: Trip */
    const [tripRows] = await pool.query<any[]>(tripSql, [tripId]);

    if (!tripRows || tripRows.length === 0) {
      return null;
    }

    /** STEP 2: Parallel Queries */
    const [
      memberResult,
      dateResult,
      provinceResult,
      budgetResult,
      memberAvailabilityResult
    ] = await Promise.all([
      pool.query<any[]>(memberSql, [tripId]),
      pool.query<any[]>(dateRangeSql, [tripId]),
      pool.query<any[]>(provinceVotesSql, [tripId]),
      pool.query<any[]>(budgetOptionsSql, [tripId]),
      pool.query<any[]>(memberAvailabilitySql, [tripId])
    ]);

    const memberRows = memberResult[0];
    const dateRows = dateResult[0];
    const provinceRows = provinceResult[0];
    const budgetRows = budgetResult[0];
    const memberAvailabilityRows = memberAvailabilityResult[0];

    //console.log("members:",memberRows);
    //console.log("dateRanges:",dateRows);
    //console.log("provinceVotes:",provinceRows);
    //console.log("budgetOptions:",budgetRows);
    //console.log("memberAvailabilitys:",memberAvailabilityRows);

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

  } catch (error) {
    console.error(" getTripDetail error:", error);
    throw error; 
  }
}



export async function findOpenTripsByUserId(user_id: string): Promise<Trip[]> {
  const sql = `
    SELECT 
      t.trip_id,
      t.status
    FROM trips t
    JOIN trip_members tm ON t.trip_id = tm.trip_id
    WHERE tm.user_id = ? 
      AND tm.is_active = 1
      AND tm.status = 'active'
      AND t.status IN ('planning', 'voting')
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [user_id]);
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
    `SELECT * FROM trip_members WHERE trip_id = ? AND member_id = ? AND is_active = 1 AND status = 'active'`,
    [trip_id, member_id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getTripMembers = async (trip_id: string) => {

  const [rows] = await pool.query<TripMember[]>(
    `
    SELECT 
      tm.member_id,
      tm.trip_id,
      tm.user_id,
      tm.role,
      tm.joined_at,
      tm.status,
      tm.is_active,
      u.full_name
    FROM trip_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.trip_id = ?
    AND tm.status = 'active'
    `,
    [trip_id]
  );

  return rows;
};

export const getMemberByTripAndUser = async (trip_id: string,user_id: string): Promise<TripMember | null> => {

  const [rows] = await pool.query<TripMember[]>(
    `
    SELECT *
    FROM trip_members
    WHERE trip_id = ?
    AND user_id = ?
    LIMIT 1
    `,
    [trip_id, user_id]
  );

  console.log("getMemberByTripAndUser:",rows)

  return rows[0] || null;
};

export const getTripMembersWithEmail = async (trip_id: string) => {
  const [rows] = await pool.query<TripMemberWithEmail[]>(
    `
    SELECT 
      tm.user_id,
      u.email,
      u.full_name
    FROM trip_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.trip_id = ?
    AND tm.status = 'active'
    AND u.is_active = 1
    `,
    [trip_id]
  );

  return rows;
};


// สมาชิกที่ออกจากทริปต้องไม่สามารถเข้าถึงข้อมูลโหวต/งบ/สถานที่ได้อีก
export const removeMemberById = async (trip_id: string,member_id: string) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    // 1. หา user_id
    const [rows] = await connection.query<RowDataPacket[]>(`
      SELECT user_id
      FROM trip_members
      WHERE member_id = ?
      AND trip_id = ?
      AND status = 'active'
      AND is_active = 1
    `, [member_id, trip_id]);

    if (rows.length === 0) {
      throw new Error("Member not found or already removed");
    }
    
    const member = rows[0];
    if (!member) {
      throw new Error("Member not found or already removed");
    }

    const user_id = member.user_id;

    // 2. soft delete member
    await connection.query(`
      UPDATE trip_members
      SET
        is_active = 0,
        status = 'rejected'
      WHERE member_id = ?
      AND trip_id = ?
    `, [member_id, trip_id]);

    // 3. delete date votes (correct join)
    await connection.query(`
      DELETE dv FROM date_votes dv
      JOIN date_options do ON dv.date_option_id = do.date_option_id
      JOIN date_votings dvt ON do.date_voting_id = dvt.date_voting_id
      WHERE dvt.trip_id = ?
      AND dv.user_id = ?
    `, [trip_id, user_id]);

    // 4. delete budget votes
    await connection.query(`
      DELETE bv FROM budget_votes bv
      JOIN budget_options bo ON bv.budget_option_id = bo.budget_option_id
      JOIN budget_votings bvt ON bo.budget_voting_id = bvt.budget_voting_id
      WHERE bvt.trip_id = ?
      AND bv.user_id = ?
    `, [trip_id, user_id]);

    // 5. delete location votes
    await connection.query(`
      DELETE lv FROM location_votes lv
      JOIN location_options lo ON lv.location_option_id = lo.location_option_id
      JOIN location_votings lvt ON lo.location_voting_id = lvt.location_voting_id
      WHERE lvt.trip_id = ?
      AND lv.user_id = ?
    `, [trip_id, user_id]);

    await connection.commit();

    return {
      success: true,
      message: "Member removed successfully",
      user_id: user_id
    };

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {

    connection.release();

  }
};

// หาข้อมูลทริปจาก Invite Code 
export const getTripByInviteCode = async (invite_code: string) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT trip_id, trip_name, status, owner_id FROM trips WHERE invite_code = ?`,
        [invite_code]
    );
    return rows[0]; // คืนค่า undefined ถ้าหาไม่เจอ
};



// ดึงสมาชิกเก่ากลับเข้าทริป (กรณีเคยออกไปแล้ว is_active = 0)
/*
export const reactivateTripMember = async (trip_id: string, user_id: string) => {
    await pool.query(
        `UPDATE trip_members SET is_active = 1, role = 'member' 
         WHERE trip_id = ? AND user_id = ?`,
        [trip_id, user_id]
    );
};
*/
// ดึงข้อมูลสรุปทริป
export async function getTripSummaryById(tripId: string): Promise<TripSummaryResult | null> {
  try {
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

    if (tripRows.length === 0) return null;

    const trip = tripRows[0];

    const [memberRows] = await pool.query<TripSummaryMember[]>(
      `
      SELECT 
        tm.user_id,
        tm.role,
        u.full_name,
        u.avatar_url
      FROM trip_members tm
      JOIN users u 
        ON tm.user_id = u.user_id
      WHERE tm.trip_id = ?
        AND tm.is_active = 1
        AND tm.status = 'active'
      `,
      [tripId]
    );

    return {
      trip,
      members: memberRows,
      totalmembers: memberRows.length
    };

  } catch (err) {
    console.error("❌ getTripSummaryById ERROR:", err);
    throw err;
  }
}


export const updateTripStatus = async (connection: unknown, trip_id: string, status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived') => {
  await pool.query(
    'UPDATE trips SET status = ?, updated_at = NOW() WHERE trip_id = ?',
    [status, trip_id]
  );
};

export const getStatusVoteResult = async (trip_id: string) => {
  try {

    const totalMembersSql = `
      SELECT COUNT(*) AS total_members
      FROM trip_members
      WHERE trip_id = ?
        AND is_active = 1
    `;

    const dateVoteSql = `
      SELECT COUNT(DISTINCT dv.user_id) AS total_voters
      FROM date_votes dv
      JOIN date_options do 
        ON dv.date_option_id = do.date_option_id
      JOIN date_votings dvt 
        ON do.date_voting_id = dvt.date_voting_id
      WHERE dvt.trip_id = ?
    `;

    const budgetVoteSql = `
      SELECT COUNT(DISTINCT bv.user_id) AS total_voters
      FROM budget_votes bv
      JOIN budget_options bo 
        ON bv.budget_option_id = bo.budget_option_id
      JOIN budget_votings bvt 
        ON bo.budget_voting_id = bvt.budget_voting_id
      WHERE bvt.trip_id = ?
    `;

    const locationVoteSql = `
      SELECT COUNT(DISTINCT lv.user_id) AS total_voters
      FROM location_votes lv
      JOIN location_options lo 
        ON lv.location_option_id = lo.location_option_id
      JOIN location_votings lvt 
        ON lo.location_voting_id = lvt.location_voting_id
      WHERE lvt.trip_id = ?
    `;

    const [
      totalMembersResult,
      dateResult,
      budgetResult,
      locationResult
    ] = await Promise.all([
      pool.query<RowDataPacket[]>(totalMembersSql, [trip_id]),
      pool.query<RowDataPacket[]>(dateVoteSql, [trip_id]),
      pool.query<RowDataPacket[]>(budgetVoteSql, [trip_id]),
      pool.query<RowDataPacket[]>(locationVoteSql, [trip_id])
    ]);

    return {
      totalMembers: totalMembersResult[0][0]?.total_members ?? 0,
      dateVoteNum: dateResult[0][0]?.total_voters ?? 0,
      budgetVoteNum: budgetResult[0][0]?.total_voters ?? 0,
      locationVoteNum: locationResult[0][0]?.total_voters ?? 0
    };

  } catch (error) {
    console.error("❌ getStatusVoteResult ERROR:", error);
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

export const getTripOwner = async (trip_id: string) => {

  const [rows]: any = await pool.query(
    `
    SELECT
      tm.user_id,
      u.email,
      u.full_name
    FROM trip_members tm
    JOIN users u ON u.user_id = tm.user_id
    WHERE tm.trip_id = ?
    AND tm.role = 'owner'
    AND tm.status = 'active'
    LIMIT 1
    `,
    [trip_id]
  );

  return rows[0];

};

export const getTripMemberCount = async (trip_id: string): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS member_count FROM trip_members WHERE trip_id = ? AND is_active = 1 AND status = 'active'`,
    [trip_id]
  );

  return rows.length > 0 ? rows[0]?.member_count : 0;
};

export const addPendingMember = async (trip_id: string, user_id: string) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const member_id = uuidv4();

    const sql = `
      INSERT INTO trip_members (
        member_id,
        trip_id,
        user_id,
        role,
        status,
        is_active,
        joined_at
      )
      VALUES (?, ?, ?, 'member', 'pending', 0, NOW())
    `;

    await connection.query(sql, [
      member_id,
      trip_id,
      user_id
    ]);

    await connection.commit();

    return {
      success: true,
      member_id,
      trip_id,
      user_id,
      status: "pending",
      message: "Join request created successfully"
    };

  } catch (error) {

    if (connection) await connection.rollback();

    console.error("addPendingMember error:", error);

    throw error;

  } finally {

    if (connection) connection.release();

  }
};

export const approveMemberModel = async (trip_id: string,user_id: string) => {

  let connection;

  try {

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const sql = `
      UPDATE trip_members
      SET
        status = 'active',
        is_active = 1
      WHERE trip_id = ?
      AND user_id = ?
      AND status = 'pending'
    `;

    const [result]: any = await connection.query(sql, [
      trip_id,
      user_id
    ]);

    if (result.affectedRows === 0) {
      throw new Error("No pending member found or already approved");
    }

    await connection.commit();

    return {
      success: true,
      trip_id,
      user_id,
      status: "active",
      message: "Member approved successfully"
    };

  } catch (error) {

    if (connection) await connection.rollback();

    console.error("approveMember error:", error);

    throw error;

  } finally {

    if (connection) connection.release();

  }

};

export const getPendingMembers = async (trip_id: string) => {

  let connection;

  try {

    connection = await pool.getConnection();

    const sql = `
      SELECT
        tm.member_id,
        tm.user_id,
        u.full_name,
        u.avatar_url,
        tm.joined_at
      FROM trip_members tm
      JOIN users u ON u.user_id = tm.user_id
      WHERE tm.trip_id = ?
      AND tm.status = 'pending'
      ORDER BY tm.joined_at ASC
    `;

    const [rows]: any = await connection.query(sql, [trip_id]);

    return {
      success: true,
      count: rows.length,
      data: rows
    };

  } catch (error) {

    console.error("getPendingMembers error:", error);

    throw error;

  } finally {

    if (connection) connection.release();

  }

};

export const rejectMember = async (trip_id: string,user_id: string) => {

  let connection;

  try {

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const sql = `
      DELETE FROM trip_members
      WHERE trip_id = ?
      AND user_id = ?
      AND status = 'pending'
    `;

    const [result]: any = await connection.query(sql, [
      trip_id,
      user_id
    ]);

    if (result.affectedRows === 0) {
      throw new Error("No pending member found");
    }

    await connection.commit();

    return {
      success: true,
      trip_id,
      user_id,
      message: "Member rejected successfully"
    };

  } catch (error) {

    if (connection) await connection.rollback();

    console.error("rejectMember error:", error);

    throw error;

  } finally {

    if (connection) connection.release();

  }

};

export const updateMemberStatus = async (trip_id: string,user_id: string,status: "pending" | "active" | "rejected") => {

  let connection;

  try {

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const is_active = status === "active" ? 1 : 0;

    const sql = `
      UPDATE trip_members
      SET
        status = ?,
        is_active = ?
      WHERE trip_id = ?
      AND user_id = ?
    `;

    const [result]: any = await connection.query(sql, [
      status,
      is_active,
      trip_id,
      user_id
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Member not found");
    }

    await connection.commit();

    return {
      success: true,
      trip_id,
      user_id,
      status,
      message: "Member status updated successfully"
    };

  } catch (error) {

    if (connection) await connection.rollback();

    console.error("updateMemberStatus error:", error);

    throw error;

  } finally {

    if (connection) connection.release();

  }

};

export const getMemberWithEmail = async (trip_id: string,user_id: string) => {
  try {

    const [rows]: any = await pool.query(
      `
      SELECT
        tm.member_id,
        tm.trip_id,
        tm.user_id,
        tm.role,
        tm.status,
        tm.is_active,
        tm.joined_at,
        u.full_name,
        u.email
      FROM trip_members tm
      JOIN users u
        ON tm.user_id = u.user_id
      WHERE tm.trip_id = ?
      AND tm.user_id = ?
      AND tm.status = 'active'
      LIMIT 1
      `,
      [trip_id, user_id]
    );

    return rows.length > 0 ? rows[0] : null;

  } catch (error) {

    console.error("getMemberWithEmail error:", error);
    throw error;

  }

};

export const getMemberWithEmailPending = async (trip_id: string,user_id: string) => {
  try {

    const [rows]: any = await pool.query(
      `
      SELECT
        tm.member_id,
        tm.trip_id,
        tm.user_id,
        tm.role,
        tm.status,
        tm.is_active,
        tm.joined_at,
        u.full_name,
        u.email
      FROM trip_members tm
      JOIN users u
        ON tm.user_id = u.user_id
      WHERE tm.trip_id = ?
      AND tm.user_id = ?
      AND tm.status = 'pending'
      LIMIT 1
      `,
      [trip_id, user_id]
    );
    console.log("getMemberWithEmailPending:",rows)

    return rows.length > 0 ? rows[0] : null;

  } catch (error) {

    console.error("getMemberWithEmail error:", error);
    throw error;

  }

};

interface OwnerRow extends RowDataPacket {
  owner_id: string;
}

export const findOwnerByTrip = async (trip_id: string): Promise<string | null> => {

  const [rows] = await pool.query<OwnerRow[]>(
    `
    SELECT owner_id
    FROM trips
    WHERE trip_id = ?
    `,
    [trip_id]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0]?.owner_id ?? null;
};

export default {
    generateInviteCode,
    generateInviteLink,
    getTripDetail,
    getMyTrips,
    findTripByInviteCode,
    findMemberInTrip,
    removeMemberById,
    deleteTrip,
    createTripWithMember,
    getTripStatus,
    getTripByInviteCode,
    findAllTripsByUserId,
    getTripMembers,
    findTripById,
    updateInviteInfo,
    getTripSummaryById,
    updateTripStatus,
    getTripMembersWithEmail,
    addPendingMember,
    approveMemberModel,
    getPendingMembers,
    rejectMember,
    getTripOwner,
    getMemberWithEmail,
    getMemberWithEmailPending,
    findOwnerByTrip
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
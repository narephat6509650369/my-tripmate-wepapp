import { pool } from "../config/db.js";
import type { RowDataPacket ,} from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid';

export const getConnection = async () => {
  return await pool.getConnection();
};

type LocationVotePayload = {
  place: string;
  score: number;
};

// ================= DATE VOTING SECTION =================


export const addAvailability = async (trip_id: string,user_id: string,available_date: Date) => {
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    /* 1. หา / สร้าง date_voting (1 ต่อ trip) */
    await connection.query(
      `INSERT INTO date_votings
       (date_voting_id, trip_id, status)
       VALUES (UUID(), ?, 'active')
       ON DUPLICATE KEY UPDATE date_voting_id = date_voting_id`,
      [trip_id]
    );

    const [votings] = await connection.query<any[]>(
      `SELECT date_voting_id
       FROM date_votings
       WHERE trip_id = ?`,
      [trip_id]
    );

    const dateVotingId = votings[0].date_voting_id;

    /* 2. หา / สร้าง date_option */
    const [options] = await connection.query<any[]>(
      `SELECT date_option_id
       FROM date_options
       WHERE date_voting_id = ? AND available_date = ?`,
      [dateVotingId, available_date]
    );

    let dateOptionId: string;

    if (options.length > 0) {
      dateOptionId = options[0].date_option_id;
    } else {
      dateOptionId = uuidv4();
      await connection.query(
        `INSERT INTO date_options
         (date_option_id, date_voting_id, proposed_by, available_date)
         VALUES (?, ?, ?, ?)`,
        [dateOptionId, dateVotingId, user_id, available_date]
      );
    }

    /* 3. user โหวตวัน */
    await connection.query(
      `INSERT INTO date_votes
       (date_vote_id, date_option_id, user_id, is_available)
       VALUES (UUID(), ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         is_available = 1`,
      [dateOptionId, user_id]
    );

    await connection.commit();
    return { success: true };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release(); 
  }
};

export const clearUserAvailability = async (trip_id: string,user_id: string) => {
  await pool.query(
    `
    DELETE dv
    FROM date_votes dv
    JOIN date_options do ON dv.date_option_id = do.date_option_id
    JOIN date_votings dvt ON do.date_voting_id = dvt.date_voting_id
    WHERE dvt.trip_id = ? AND dv.user_id = ?
    `,
    [trip_id, user_id]
  );
};

export const getTripAvailabilities = async (trip_id: string, user_id: string) => {
  const connection = await pool.getConnection();
  try{
    const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT
      do.available_date
    FROM date_votes dv
    JOIN date_options do ON dv.date_option_id = do.date_option_id
    JOIN date_votings dvt ON do.date_voting_id = dvt.date_voting_id
    WHERE dvt.trip_id = ?
      AND dv.user_id = ?
    ORDER BY do.available_date
    `,
    [trip_id, user_id]
  );
  //เพื่อ return กลับไปแสดง log สถานะการเลือกของแต่ละคน
  const [rowlog] = await connection.query(
     `SELECT
        do.available_date,
        do.proposed_at,
        do.proposed_by,
        u.full_name AS proposed_by_name
      FROM date_options do
      JOIN date_votings dvt ON do.date_voting_id = dvt.date_voting_id
      JOIN users u ON do.proposed_by = u.user_id
      WHERE dvt.trip_id = ?
      ORDER BY do.proposed_at ASC`,
      [trip_id]
  )
  return {
    dates: rows.map(r => r.available_date),
    count: rows.length,
    log: rowlog
  }
 } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getActiveMemberCount = async (tripId: string): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total 
     FROM trip_members 
     WHERE trip_id = ? AND is_active = 1`,
    [tripId]
  );
  return rows?.[0]?.total ?? 0;
};

//
export const getAvailabilitiesByTrip = async (tripId: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
      dv.user_id,
      do.available_date
    FROM date_votes dv
    JOIN date_options do ON dv.date_option_id = do.date_option_id
    JOIN date_votings dvt ON do.date_voting_id = dvt.date_voting_id
    WHERE dvt.trip_id = ?
      AND dv.is_available = 1
    ORDER BY do.available_date`,
    [tripId]
  );
  return rows;
};

/*
export const saveUserAvailability = async (date_voting_id: string, trip_id: string) => {
  const [result] = await pool.query(
    `INSERT INTO date_votings (date_voting_id, trip_id, status)
     VALUES (?, ?, 'active')`,
    [date_voting_id, trip_id]
  );
  return result;
};

export const getActiveDateVotingByTrip = async (trip_id: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT * FROM date_votings
      WHERE trip_id = ? AND status = 'active'
      LIMIT 1
    `,
    [trip_id]
  );
  return rows[0] ?? null;
};


//กรณีที่ algorithm ต้องเก็บ top-N
export const insertRankingResults = async (trip_id: string, results: { rank: number; date: string; matching_score: number; num_available: number; total_members: number; }[]) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `DELETE FROM date_ranking_results 
       WHERE trip_id = ?`,
      [trip_id]
    );

    for (const r of results) {
      await conn.query(
        `INSERT INTO date_ranking_results 
         (ranking_id, trip_id, rank, date, matching_score, num_available, total_members)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
        [
          trip_id,
          r.rank,
          r.date,
          r.matching_score,
          r.num_available,
          r.total_members
        ]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getRankingResults = async (trip_id: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT rank, date, matching_score, num_available, total_members
     FROM date_ranking_results
     WHERE trip_id = ?
     ORDER BY rank ASC`,
    [trip_id]
  );
  return rows;
};

export const insertDateVoting  = async (connection: unknown, trip_id: string, date_voting_id: string) => {
  await pool.query(
    `INSERT INTO date_votings (date_voting_id, trip_id, status) 
       VALUES (?, ?, 'active')`,
      [date_voting_id, trip_id]
  );
};

export const clearActiveVotingByTrip = async (conn: any, trip_id: string) => {
  await conn.query(
    `
      UPDATE date_votings
      SET status = 'closed'
      WHERE trip_id = ? AND status = 'active'
    `,
    [trip_id]
  );
};
*/
// ================= BUDGET SECTION =================
/*
export const getTripBudgets = async (trip_id: string, user_id: string) => {
  const connection = await pool.getConnection();
  try{
    const [row] = await connection.query( 
    `
    SELECT 
      bv.user_id,
      bv.category_name,
      bv.estimated_amount,
      bv.voted_at
    FROM budget_votes bv
    JOIN budget_votings ON 
    WHERE bv.user_id = ? AND bvt.trip_id = ?
  
  `);

  const [rowlog] =await connection.query(
     `SELECT
        bo.proposed_by,
        bo.proposed_at,
        bo.category_name,
        bo.estimated_amount,
        bo.priority,
        u.full_name AS proposed_by_name
      FROM budget_options bo
      JOIN budget_votings bvt ON bo.budget_voting_id = bvt.budget_voting_id
      JOIN users u ON bo.proposed_by = u.user_id
      WHERE bvt.trip_id = ?
      ORDER BY bo.proposed_at ASC`,
      [trip_id]
    );

  return {
    row,
    rowlog
  };
  } finally {
    connection.release();
  }
};
*/
export const getBudgetVoting = async (trip_id: string, user_id: string) => {
  const connection = await pool.getConnection();
  try{

    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT 
        bo.category_name, 
        bo.estimated_amount, 
        bo.proposed_by AS user_id, 
        bo.proposed_at AS last_updated
      FROM budget_options bo
      JOIN budget_votings bv 
      ON bo.budget_voting_id = bv.budget_voting_id
      WHERE bv.trip_id = ?
        AND bo.proposed_by = ?
      `,[trip_id,user_id]
    );

    const [rowlog] =await connection.query(
     `SELECT
        bo.proposed_by,
        bo.proposed_at,
        bo.category_name,
        bo.estimated_amount,
        bo.priority,
        u.full_name AS proposed_by_name
      FROM budget_options bo
      JOIN budget_votings bvt ON bo.budget_voting_id = bvt.budget_voting_id
      JOIN users u ON bo.proposed_by = u.user_id
      WHERE bvt.trip_id = ?
      ORDER BY bo.proposed_at ASC`,
      [trip_id]
    );
    return {
      rows,
      rowlog
    };
  } catch(err) {
    console.log("ERROR:",err);
  }  finally {
    connection.release();
  }
};

//CHECK AGAIN
export const updateBudget = async (trip_id: string, user_id: string, category: string, amount: number) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. create budget_votings (ถ้ายังไม่มี)
    await connection.query(
      `
      INSERT INTO budget_votings (budget_voting_id, trip_id, status)
      VALUES (UUID(), ?, 'active')
      ON DUPLICATE KEY UPDATE budget_voting_id = budget_voting_id
      `,
      [trip_id]
    );

    // 2. get budget_voting_id
    const [votingRows]: any = await connection.query(
      `SELECT budget_voting_id FROM budget_votings WHERE trip_id = ?`,
      [trip_id]
    );
    const budget_voting_id = votingRows[0].budget_voting_id;

    // 3. insert / update budget_options
    await connection.query(
      `
      INSERT INTO budget_options
        (budget_option_id, budget_voting_id, proposed_by, category_name, estimated_amount)
      VALUES (UUID(), ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        estimated_amount = VALUES(estimated_amount),
        proposed_at = CURRENT_TIMESTAMP
      `,
      [budget_voting_id, user_id, category, amount]
    );

    // 4. get budget_option_id
    const [optionRows]: any = await connection.query(
      `
      SELECT budget_option_id
      FROM budget_options
      WHERE budget_voting_id = ? AND proposed_by = ? AND category_name = ?
      `,
      [budget_voting_id, user_id, category]
    );
    const budget_option_id = optionRows[0].budget_option_id;

    // 5. insert / update budget_votes
    await connection.query(
      `
      INSERT INTO budget_votes
        (budget_vote_id, budget_option_id, user_id, category_name, estimated_amount)
      VALUES (UUID(), ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        estimated_amount = VALUES(estimated_amount),
        voted_at = CURRENT_TIMESTAMP
      `,
      [budget_option_id, user_id, category, amount]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


export const clearBudgetCategory = async (trip_id: string,user_id: string,category: string) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. หา budget_voting_id
    const [votingRows] = await connection.query<RowDataPacket[]>(
      `SELECT budget_voting_id FROM budget_votings WHERE trip_id = ?`,
      [trip_id]
    );

    const voting = votingRows[0];
    if (!voting) throw new Error("Budget voting session not found.");
    
    const budget_voting_id = voting.budget_voting_id;
    const new_option_id = crypto.randomUUID();

    // 2. บันทึกประวัติการ Clear (History Log) ลง budget_options
    await connection.query(
      `INSERT INTO budget_options 
        (budget_option_id, budget_voting_id, proposed_by, category_name, estimated_amount, priority)
       VALUES (?, ?, ?, ?, 0, 1)`,
      [new_option_id, budget_voting_id, user_id, category]
    );

    // 3. อัปเดตสถานะล่าสุด (Current State) ลง budget_votes
    // เปลี่ยนจาก budget_option_id เป็น new_option_id และใช้ค่า 0 สำหรับการ Clear
    await connection.query(
      `
      INSERT INTO budget_votes
        (budget_vote_id, budget_option_id, user_id, category_name, estimated_amount)
      VALUES
        (UUID(), ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        budget_option_id = VALUES(budget_option_id),
        estimated_amount = VALUES(estimated_amount),
        voted_at = CURRENT_TIMESTAMP
      `,
  [new_option_id, user_id, category, 0] // <- ต้องมี amount
  );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ================= LOCATION SECTION =================

export const submitLocationVotes = async (trip_id: string,user_id: string,votes: { place: string; score: number }[]) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. หา / สร้าง location_voting
    const [votingRows] = await connection.query<RowDataPacket[]>(
      `SELECT location_voting_id 
       FROM location_votings 
       WHERE trip_id = ?`,
      [trip_id]
    );

    let voting_id = votingRows[0]?.location_voting_id;
    //check ถ้ามีก็ไม่มี insert แล้ว แต่ 2 อันบนใช่ duplicat
    if (!voting_id) {
      voting_id = uuidv4();
      await connection.query(
        `INSERT INTO location_votings (location_voting_id, trip_id, status)
         VALUES (?, ?,'active')
         ON DUPLICATE KEY UPDATE location_voting_id = location_voting_id
         `,
        [voting_id, trip_id]
      );
    }

    // 2. ลบโหวตเก่าของ user ในทริปนี้
    await connection.query(
      `DELETE lv 
      FROM location_votes lv
       JOIN location_options lo 
         ON lv.location_option_id = lo.location_option_id
       WHERE lo.location_voting_id = ?
         AND lv.user_id = ?`,
      [voting_id, user_id]
    );

    // 3. บันทึกโหวตใหม่
    for (const vote of votes) {
      const { place: province, score } = vote;
      if (!province) continue;

      // 3.1 หา / สร้าง option
      const [optRows] = await connection.query<RowDataPacket[]>(
        `SELECT location_option_id
         FROM location_options
         WHERE location_voting_id = ?
           AND province_name = ?`,
        [voting_id, province]
      );

      let option_id = optRows[0]?.location_option_id;

      if (!option_id) {
        option_id = uuidv4();
        await connection.query(
          `INSERT INTO location_options
           (location_option_id, location_voting_id, province_name, proposed_by, score)
           VALUES (?, ?, ?, ?, 0)`,
          [option_id, voting_id, province, user_id]
        );
      }

      // 3.2 INSERT vote (มี province_name แล้ว ✅)
      await connection.query(
        `INSERT INTO location_votes
         (location_vote_id, location_option_id, user_id, score, province_name)
         VALUES (UUID(), ?, ?, ?, ?)`,
        [option_id, user_id, score, province]
      );

      // 3.3 update score cache
      await connection.query(
        `INSERT INTO location_options
        (location_option_id, location_voting_id, province_name, proposed_by, score)
        VALUES (UUID(), ?, ?, ?, ?)`,
      [voting_id, province, user_id, score]
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


export const getLocationScores = async (trip_id: string) => {
  const sql = `
    SELECT 
      lo.province_name, 
      COALESCE(SUM(lv.score), 0) as total_score
    FROM location_options lo
    LEFT JOIN location_votes lv ON lo.location_option_id = lv.location_option_id
    JOIN location_votings lvs ON lo.location_voting_id = lvs.location_voting_id
    WHERE lvs.trip_id = ?
    GROUP BY lo.province_name
    ORDER BY total_score DESC
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [trip_id]);
  return rows;
};

export const clearLocation = async (trip_id: string, user_id: string) => {
  const sql = `
    DELETE lv
    FROM location_votes lv
    JOIN location_options lo 
      ON lv.location_option_id = lo.location_option_id
    JOIN location_votings lvs 
      ON lo.location_voting_id = lvs.location_voting_id
    WHERE lvs.trip_id = ?
      AND lv.user_id = ?
  `;

  await pool.query(sql, [trip_id, user_id]);
};

export const getVoteLocation = async (tripId:string, user_id: string) => {
  const connection = await pool.getConnection();
  try{
    const [rows] = await connection.query (
      `
      SELECT 
        lv.location_vote_id,
        lv.location_option_id,
        lv.user_id,
        lv.voted_at,
        lv.score
      FROM location_votes lv
      JOIN location_options lo ON lv.location_option_id = lo.location_option_id
      JOIN location_votings lvt ON lo.location_voting_id = lvt.location_voting_id
      WHERE lvt.trip_id = ? AND lv.user_id = ?
      `,
      [tripId, user_id]
    );

  const [locationVotesTotal] = await connection.query(
  `
    SELECT 
      lo.province_name AS place,
        SUM(lv.score) AS total_score,
        COUNT(lv.location_vote_id) AS vote_count,
        SUM(CASE WHEN lv.score = 3 THEN 1 ELSE 0 END) AS rank_1,
        SUM(CASE WHEN lv.score = 2 THEN 1 ELSE 0 END) AS rank_2,
        SUM(CASE WHEN lv.score = 1 THEN 1 ELSE 0 END) AS rank_3
      FROM location_votes lv
      JOIN location_options lo ON lv.location_option_id = lo.location_option_id
      JOIN location_votings lvt ON lo.location_voting_id = lvt.location_voting_id
      WHERE lvt.trip_id = ?
      GROUP BY lo.province_name
      ORDER BY total_score DESC;

  `,
  [tripId]
  );

  const [rowlog] = await connection.query(
    `
    SELECT
      lo.proposed_by,
      lo.province_name,
      lo.score,
      lo.proposed_at,
      u.full_name AS proposed_by_name
    FROM location_options lo
    JOIN location_votings lvt ON lo.location_voting_id = lvt.location_voting_id
    JOIN users u ON lo.proposed_by = u.user_id
    WHERE lvt.trip_id = ?
    `,
    [tripId]
  )
    return {
      rows,
      locationVotesTotal,
      rowlog
     };
  } finally {
    connection.release();
  }
}

// ================= TRIP STATUS =================



export const closeAllVotings = async (trip_id: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // ปิด Date Voting
    await connection.query(
      `UPDATE date_votings 
       SET status = 'closed', closed_at = NOW() 
       WHERE trip_id = ? AND status = 'active'`,
      [trip_id]
    );
    
    // ปิด Budget Voting
    await connection.query(
      `UPDATE budget_votings 
       SET status = 'closed', closed_at = NOW() 
       WHERE trip_id = ? AND status = 'active'`,
      [trip_id]
    );
    
    // ปิด Location Voting
    await connection.query(
      `UPDATE location_votings 
       SET status = 'closed', closed_at = NOW() 
       WHERE trip_id = ? AND status = 'active'`,
      [trip_id]
    );
    
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export default {
  getConnection,
  addAvailability,
  getTripAvailabilities,
  closeAllVotings,
  getBudgetVoting,
  updateBudget,
  submitLocationVotes,
  getLocationScores,
  getActiveMemberCount,
  getVoteLocation,
  getAvailabilitiesByTrip
};

/*
saveUserAvailability,
  getActiveDateVotingByTrip,
  insertDateVoting,
  clearActiveVotingByTrip,
  insertRankingResults,
  getRankingResults,
  clearUserAvailability,
*/
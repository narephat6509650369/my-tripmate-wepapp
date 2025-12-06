import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2";
import { v4 as uuidv4 } from 'uuid';

//1) INSERT DATE OPTION (เพิ่มตัวเลือกวันที่)
export const insertDateOption = async (date_voting_id: string, user_id: string, start_date: string, end_date: string) => {
  const [result] = await pool.query(
    `INSERT INTO date_options (date_option_id, date_voting_id, proposed_by, start_date, end_date)
     VALUES (UUID(), ?, ?, ?, ?)`,
    [date_voting_id, user_id, start_date, end_date]
  );
  return result;
};

// 2) VOTE DATE OPTION (โหวตว่าตัวเลือกนี้ว่างหรือไม่)
export const voteDateOption = async (option_id: string, user_id: string, is_available: number) => {
  await pool.query(
    `INSERT INTO date_votes (date_vote_id, date_option_id, user_id, is_available)
     VALUES (UUID(), ?, ?, ?)
     ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)`,
    [option_id, user_id, is_available]
  );
};


// 3) GET OPTIONS BY TRIP (ดึงตัวเลือกวันทั้งหมดของทริป)
export const getOptionsByTrip = async (trip_id: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT o.*, dv.trip_id
     FROM date_options o
     JOIN date_votings dv ON dv.date_voting_id = o.date_voting_id
     WHERE dv.trip_id = ?`,
    [trip_id]
  );
  return rows;
};


// 4) GET VOTE SUMMARY (สรุปว่าทุกตัวเลือกมีกี่คนว่าง/ไม่ว่าง)
export const getVotesSummary = async (trip_id: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
        o.date_option_id,
        o.start_date,
        o.end_date,
        SUM(CASE WHEN v.is_available = 1 THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN v.is_available = 0 THEN 1 ELSE 0 END) AS not_available
     FROM date_options o
     JOIN date_votings dv ON dv.date_voting_id = o.date_voting_id
     LEFT JOIN date_votes v ON v.date_option_id = o.date_option_id
     WHERE dv.trip_id = ?
     GROUP BY o.date_option_id, o.start_date, o.end_date`,
    [trip_id]
  );
  return rows;
};

// 5) INSERT DATE VOTING (สร้างห้องโหวตวันที่)
export const insertDateVoting = async (date_voting_id: string, trip_id: string) => {
  const [result] = await pool.query(
    `INSERT INTO date_votings (date_voting_id, trip_id, status)
     VALUES (?, ?, 'active')`,
    [date_voting_id, trip_id]
  );
  return result;
};

// 6) GET ACTIVE DATE VOTING BY TRIP (ดึงห้องโหวตวันที่ที่กำลัง active ของทริป)
export const getActiveDateVotingByTrip = async (trip_id: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM date_votings 
     WHERE trip_id = ? AND status = 'active'
     LIMIT 1`,
    [trip_id]
  );
  return rows[0]; // คืนค่า object แรกหรือ undefined
};

export const generateUUID = async () => {
  return uuidv4();
}

export default {
  insertDateOption,
  voteDateOption,
  getOptionsByTrip,
  getVotesSummary,
  insertDateVoting,
  getActiveDateVotingByTrip,
  generateUUID,
};

import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2";

// 1) INSERT USER AVAILABILITY (บันทึกช่วงเวลาที่ user ว่าง)
// User คนนึงอาจจะส่งมาหลายช่วงก็ได้ เช่น ว่าง 20-22 และ 25-27
export const addAvailability = async (trip_id: string, user_id: string, start_date: string, end_date: string) => {
  const [result] = await pool.query(
    `INSERT INTO trip_user_availabilities (availability_id, trip_id, user_id, start_date, end_date)
     VALUES (UUID(), ?, ?, ?, ?)`,
    [trip_id, user_id, start_date, end_date]
  );
  return result;
};

// 2) DELETE USER AVAILABILITY (ลบวันว่างของตัวเอง เผื่อเปลี่ยนใจ)
export const clearUserAvailability = async (trip_id: string, user_id: string) => {
    await pool.query(
        `DELETE FROM trip_user_availabilities WHERE trip_id = ? AND user_id = ?`,
        [trip_id, user_id]
    );
}

// 3) GET HEATMAP DATA (ดึงข้อมูลเพื่อมาคำนวณว่าวันไหนคนว่างเยอะสุด)
// อันนี้จะดึงช่วงเวลาทั้งหมดของทุกคนในทริปออกมา แล้วให้ Frontend หรือ Service ไปคำนวณกราฟ
export const getTripAvailabilities = async (trip_id: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
        user_id,
        start_date, 
        end_date 
     FROM trip_user_availabilities 
     WHERE trip_id = ?`,
    [trip_id]
  );
  return rows;
};

// 4) (Optional) ถ้าอยากให้ SQL คำนวณเบื้องต้นว่าวันไหนมีคนทับซ้อนกันบ้าง
// หมายเหตุ: การคำนวณ overlaps ละเอียดๆ มักทำใน Javascript ง่ายกว่า SQL
// แต่อันนี้เป็นตัวอย่าง SQL ดึง User ที่ว่างในแต่ละช่วง
export const getUsersInDateRange = async (trip_id: string, target_start: string, target_end: string) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT user_id 
         FROM trip_user_availabilities
         WHERE trip_id = ? 
         AND (start_date <= ? AND end_date >= ?)`, 
        [trip_id, target_end, target_start]
    );
    return rows;
}

// ... ส่วน insertDateVoting (สร้างห้อง) ใช้เหมือนเดิมได้ครับ ...
export const insertDateVoting = async (date_voting_id: string, trip_id: string) => {
  const [result] = await pool.query(
    `INSERT INTO date_votings (date_voting_id, trip_id, status)
     VALUES (?, ?, 'active')`,
    [date_voting_id, trip_id]
  );
  return result;
};

// 6) GET ACTIVE DATE VOTING BY TRIP (ดึงห้องโหวตวันที่ที่กำลัง active ของทริป)
// เอาไว้เช็คว่าทริปนี้มีการเปิดโหวตค้างไว้หรือยัง หรือเอาไว้ดึง voting_id ไปใช้งาน
export const getActiveDateVotingByTrip = async (trip_id: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM date_votings 
     WHERE trip_id = ? AND status = 'active'
     LIMIT 1`,
    [trip_id]
  );
  
  // คืนค่า object แรกที่เจอ หรือถ้าไม่มีจะคืนค่า undefined
  return rows[0]; 
};

export default {
  addAvailability,
  clearUserAvailability,
  getTripAvailabilities,
  insertDateVoting,
  getActiveDateVotingByTrip,
  
};

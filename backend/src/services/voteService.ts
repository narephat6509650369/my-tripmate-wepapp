import voteModel from "../models/voteModel.js";
import { generateUUID, } from "../models/voteModel.js"; // สำหรับดึงข้อมูล Trip

// 1. เพิ่มฟังก์ชันค้นหาหรือสร้าง date_voting (ถ้ายังไม่มี)
const getOrCreateDateVoting = async (tripId: string) => {
  // ค้นหา date_voting ที่ active ของทริปนี้
  let voting = await voteModel.getActiveDateVotingByTrip(tripId);

  if (!voting) {
    // ถ้ายังไม่มี date_voting ให้สร้างใหม่
    const newVotingId = await generateUUID();
    await voteModel.insertDateVoting(newVotingId, tripId);
    voting = await voteModel.getActiveDateVotingByTrip(tripId); // ดึงข้อมูลที่สร้างใหม่
  }
  return voting;
};

// 2. Use Case: UC09 - เพิ่มตัวเลือกวันที่ว่าง
export const addDateOption = async (tripId: string, userId: string, startDate: string, endDate: string) => {
  // 1. ตรวจสอบว่าผู้ใช้เป็นสมาชิกของทริปหรือไม่ (ควรทำใน Middleware หรือ Controller)

  // 2. ตรวจสอบหรือสร้าง Date Voting Session
  const dateVoting = await getOrCreateDateVoting(tripId);
  if (!dateVoting) {
    throw new Error("Cannot create or retrieve date voting session.");
  }

  // 3. บันทึกตัวเลือกวันที่ลงใน database
  const result = await voteModel.insertDateOption(dateVoting.date_voting_id, userId, startDate, endDate);

  // 4. (TODO: เพิ่มตรรกะการแจ้งเตือน FR5.4)

  return result;
};


export default {
  getOrCreateDateVoting,
  addDateOption,
};
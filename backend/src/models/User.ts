import { pool } from "../config/db.js";

export interface User {
  id: number;
  name: string;
  email: string;
  google_id?: string;
  profile_pic?: string;
  email_verified: boolean;
  created_at?: Date;
  isNewUser?: boolean;
}

// 🔹 สร้างผู้ใช้ใหม่
export async function createUser(user: User): Promise<User> {
  const [result]: any = await pool.query(
    `INSERT INTO users (name, email, google_id, profile_pic, email_verified)
     VALUES (?, ?, ?, ?, ?)`,
    [user.name, user.email, user.google_id || null, user.profile_pic || null, user.email_verified || false]
  );

  return { ...user, id: result.insertId };
}

// 🔹 ค้นหาผู้ใช้ด้วย email
export async function findUserByEmail(email: string): Promise<User | null> {
  const [rows]: any = await pool.query(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  return rows.length ? rows[0] : null;
}

// 🔹 ค้นหาผู้ใช้ด้วย id
export async function findUserById(id: number): Promise<User | null> {
  const [rows]: any = await pool.query(
    `SELECT * FROM users WHERE id = ? LIMIT 1`,
    [id]
  );

  return rows.length ? rows[0] : null;
}

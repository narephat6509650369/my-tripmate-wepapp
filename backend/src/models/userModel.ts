import { pool } from './../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  google_id?: string | null;
  avatar_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
  is_active?: boolean;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const users = rows as User[];
  return users[0] || null;
}

export async function getUserById(userId: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
  const users = rows as User[];
  return users[0] || null;
}

export async function createUser(user: User): Promise<void> {
  await pool.query(
    'INSERT INTO users (user_id, email, full_name, google_id, avatar_url) VALUES (?, ?, ?, ?, ?)',
    [user.user_id, user.email, user.full_name, user.google_id, user.avatar_url]
  );
}

export async function updateUser(user: User): Promise<void> {
  await pool.query(
    'UPDATE users SET email = ?, full_name = ?, google_id = ?, avatar_url = ? WHERE user_id = ?',
    [user.email, user.full_name, user.google_id, user.avatar_url, user.user_id]
  );
}

export async function deleteUser(userId: string): Promise<void> {
  await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
}

// ฟังก์ชันใหม่: findOrCreateUser
export async function findOrCreateUser(userData: {
  email: string;
  fullName: string;
  google_id?: string | null;
  avatarUrl?: string | null;
}): Promise<User> {
  // เช็คว่ามี user อยู่แล้วหรือไม่
  let user = await getUserByEmail(userData.email);
  if (user) {
    // ถ้ามีแล้ว อัปเดตข้อมูลบางส่วน (avatar, google_id)
    user.full_name = userData.fullName;
    if (userData.google_id !== undefined) user.google_id = userData.google_id;
    if (userData.avatarUrl !== undefined) user.avatar_url = userData.avatarUrl;
    await updateUser(user);
    return user;
  } else {
    // ถ้าไม่มี สร้าง user ใหม่
    const newUser: User = {
      user_id: uuidv4(),
      email: userData.email,
      full_name: userData.fullName,
      google_id: userData.google_id || null,
      avatar_url: userData.avatarUrl || null,
      is_active: true
    };
    await createUser(newUser);
    return newUser;
  }
}



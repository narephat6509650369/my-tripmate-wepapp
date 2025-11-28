// /models/userModel.ts
import { pool } from './../config/db.js';

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



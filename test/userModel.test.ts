// tests/userModel.test.ts
import { findOrCreateUser, getUserByEmail, type User } from '../models/userModel.js';
import { pool } from '../config/db.js';
import { describe, it, afterAll } from 'vitest';
import { expect } from 'vitest';

afterAll(async () => {
  await pool.end(); // ปิด connection หลัง test
});

describe('findOrCreateUser', () => {
  const testEmail = 'testuser@example.com';

  it('should create a new user if not exists', async () => {
    // ลบ user ถ้ามีอยู่แล้ว
    await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);

    const user = await findOrCreateUser({
      email: testEmail,
      fullName: 'Test User',
      avatarUrl: 'http://avatar.com/test.png'
    });

    expect(user).toHaveProperty('user_id');
    expect(user.email).toBe(testEmail);
    expect(user.full_name).toBe('Test User');
  });

  it('should update existing user', async () => {
    const userBefore = await getUserByEmail(testEmail);

    const updatedUser = await findOrCreateUser({
      email: testEmail,
      fullName: 'Updated Name',
      avatarUrl: 'http://avatar.com/new.png'
    });

    expect(updatedUser.user_id).toBe(userBefore!.user_id);
    expect(updatedUser.full_name).toBe('Updated Name');
    expect(updatedUser.avatar_url).toBe('http://avatar.com/new.png');
  });

  it('should not overwrite google_id if not provided', async () => {
    const userBefore = await getUserByEmail(testEmail);
    // อัปเดต google_id ก่อน
    userBefore!.google_id = 'google123';
    await pool.query(
        'UPDATE users SET google_id = ? WHERE user_id = ?',
        [userBefore!.google_id, userBefore!.user_id]
    );

    const updatedUser = await findOrCreateUser({
      email: testEmail,
      fullName: 'Name With Google ID',
      // ไม่ส่ง google_id มา
      avatarUrl: 'http://avatar.com/withgoogle.png'
    }); 
    expect(updatedUser.user_id).toBe(userBefore!.user_id);
    expect(updatedUser.google_id).toBe('google123'); // ควรยังคงค่าเดิม
    });

    it('should overwrite google_id if provided', async () => {
        const userBefore = await getUserByEmail(testEmail);
        const updatedUser = await findOrCreateUser({
            email: testEmail,
            fullName: 'Name With New Google ID',
            google_id: 'newgoogle456',
            avatarUrl: 'http://avatar.com/withnewgoogle.png'
        });
        expect(updatedUser.user_id).toBe(userBefore!.user_id);
        expect(updatedUser.google_id).toBe('newgoogle456'); // ควรถูกอัปเดตเป็นค่าใหม่
    });

    it ('should not overwrite avatar_url if not provided', async () => {
        const userBefore = await getUserByEmail(testEmail);
        // อัปเดต avatar_url ก่อน
        userBefore!.avatar_url = 'http://avatar.com/original.png';
        await pool.query(
            'UPDATE users SET avatar_url = ? WHERE user_id = ?',
            [userBefore!.avatar_url, userBefore!.user_id]
        );
        const updatedUser = await findOrCreateUser({
            email: testEmail,
            fullName: 'Name With Original Avatar',
            // ไม่ส่ง avatarUrl มา
            google_id: 'google789'
        });
        expect(updatedUser.user_id).toBe(userBefore!.user_id);
        expect(updatedUser.avatar_url).toBe('http://avatar.com/original.png'); // ควรยังคงค่าเดิม
    });

    it('should overwrite avatar_url if provided', async () => {
        const userBefore = await getUserByEmail(testEmail);
        const updatedUser = await findOrCreateUser({
            email: testEmail,
            fullName: 'Name With New Avatar',
            google_id: 'google101',
            avatarUrl: 'http://avatar.com/newavatar.png'
        });
        expect(updatedUser.user_id).toBe(userBefore!.user_id);
        expect(updatedUser.avatar_url).toBe('http://avatar.com/newavatar.png'); // ควรถูกอัปเดตเป็นค่าใหม่
    });

    it('should handle null google_id and avatarUrl correctly', async () => {
        const userBefore = await getUserByEmail(testEmail);
        const updatedUser = await findOrCreateUser({
            email: testEmail,
            fullName: 'Name With Nulls',    
            google_id: null,
            avatarUrl: null
        });
        expect(updatedUser.user_id).toBe(userBefore!.user_id);
        expect(updatedUser.google_id).toBeNull();
        expect(updatedUser.avatar_url).toBeNull();
    });

    it('should handle undefined google_id and avatarUrl correctly', async () => {
        const userBefore = await getUserByEmail(testEmail);
        const updatedUser = await findOrCreateUser({
            email: testEmail,
            fullName: 'Name With Undefineds',    
            // ไม่ส่ง google_id และ avatarUrl มา
        });
        expect(updatedUser.user_id).toBe(userBefore!.user_id);
        expect(updatedUser.google_id).toBe(userBefore!.google_id);
        expect(updatedUser.avatar_url).toBe(userBefore!.avatar_url);
    });


    it('should delete the test user after tests', async () => {
        await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);
        const userAfter = await getUserByEmail(testEmail);
        expect(userAfter).toBeNull();
    });

});


import { describe, it, expect, vi, afterAll } from "vitest";
import * as tripModel from "../services/tripService.js";
import { pool } from '../config/db.js';
import { findOrCreateUser,getUserByEmail} from "../models/userModel.js";


afterAll(async () => {
  await pool.end(); // ปิด connection หลัง test
});

describe("Trip Model Tests", () => {
  it("should initialize a trip correctly", async () => {
    await pool.query('DELETE FROM users WHERE email = ?', ['testuser@example.com']);

    const user = await findOrCreateUser({
      email: 'testuser@example.com',
      fullName: 'Test User',
      avatarUrl: 'http://avatar.com/test.png'
    });

    const tripData = {
      user_id: user.user_id,
      trip_name: "Test Trip",
      description: "This is a test trip",
      num_days: 3
    };

    const trip = await tripModel.initializeTrip(tripData);

    expect(trip.trip_name).toBe("Test Trip");
    expect(trip.owner_id).toBe(user.user_id);
    expect(trip.status).toBe("planning");
    expect(trip.trip_id).toBeDefined();
    expect(trip.invite_code).toBeDefined();
    expect(trip.invite_link).toContain(trip.trip_id);
  });
});

/*
    it("should initialize a trip for voting correctly", async () => {
    // mock createTrip ไม่ให้ยิง DB จริง
    vi.spyOn(tripModel, "createTrip").mockResolvedValue(undefined);
    const tripData = {
      owner_id: "voting-user-id",
      trip_name: "Voting Trip",
      description: null,
      num_days: 5
    };  
    const trip = await tripModel.initializeTripVoting(tripData);
    expect(trip.trip_name).toBe("Voting Trip");
    expect(trip.owner_id).toBe("voting-user-id");
    expect(trip.status).toBe("voting");
    expect(trip.trip_id).toBeDefined();
    expect(trip.invite_code).toBeDefined();
    expect(trip.invite_link).toContain(trip.trip_id);
  });
*/

it('should delete the test user after tests', async () => {
        await pool.query('DELETE FROM users WHERE email = ?', ['testuser@example.com']);
        const userAfter = await getUserByEmail('testuser@example.com');
        expect(userAfter).toBeNull();
    });

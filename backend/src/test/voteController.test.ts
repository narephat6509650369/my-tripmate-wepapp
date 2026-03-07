import { vi, describe, it, expect, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  submitAvailabilityController,
  submitBudgetVoteController,
  submitLocationVoteController,
} from "../controllers/voteController.js";

import * as voteService from "../services/voteService.js";
import * as tripService from "../services/tripService.js";

vi.mock("../services/voteService.js");
vi.mock("../services/tripService.js");

const mockVoteService = voteService as import("vitest").Mocked<typeof voteService>;
const mockTripService = tripService as import("vitest").Mocked<typeof tripService>;

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const req = (overrides = {}) =>
  ({ user: { user_id: "user1" }, params: {}, body: {}, query: {}, ...overrides } as unknown as Request);

beforeEach(() => vi.clearAllMocks());

// submitAvailabilityController, submitBudgetVoteController, submitLocationVoteController

// ==================== submitAvailabilityController ====================

describe("submitAvailabilityController", () => {
  it("returns 400 if trip_id is missing", async () => {
    const res = mockRes();
    await submitAvailabilityController(req({ body: { ranges: ["2025-01-01"] } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 if trip is closed", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("confirmed" as any);
    await submitAvailabilityController(req({ body: { trip_id: "t1", ranges: ["2025-01-01"] } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TRIP_CLOSED" }));
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("open" as any);
    mockVoteService.submitAvailability.mockResolvedValueOnce({ message: "submitted" } as any);
    mockTripService.closeTripService.mockResolvedValueOnce({ success: true } as any);
    await submitAvailabilityController(req({ body: { trip_id: "t1", ranges: ["2025-01-01"] } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "AVAILABILITY_SUBMITTED" }));
  });
});

// ==================== submitBudgetVoteController ====================

describe("submitBudgetVoteController", () => {
  it("returns 400 if required fields are missing", async () => {
    const res = mockRes();
    await submitBudgetVoteController(req({ params: { tripId: "t1" }, body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 if trip is closed", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("completed" as any);
    await submitBudgetVoteController(
      req({ params: { tripId: "t1" }, body: { category: "food", amount: 500 } }), res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TRIP_CLOSED" }));
  });

  it("returns 403 if user is not a member", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("open" as any);
    mockVoteService.updateBudget.mockRejectedValueOnce(new Error("คุณไม่ได้เป็นสมาชิกของทริปนี้"));
    mockTripService.closeTripService.mockResolvedValueOnce({ success: true } as any);
    await submitBudgetVoteController(
      req({ params: { tripId: "t1" }, body: { category: "food", amount: 500 } }), res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("open" as any);
    mockVoteService.updateBudget.mockResolvedValueOnce({ message: "updated" } as any);
    mockTripService.closeTripService.mockResolvedValueOnce({ success: true } as any);
    await submitBudgetVoteController(
      req({ params: { tripId: "t1" }, body: { category: "food", amount: 500 } }), res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "BUDGET_UPDATED" }));
  });
});

// ==================== submitLocationVoteController ====================

describe("submitLocationVoteController", () => {
  it("returns 400 if votes array is not exactly 3", async () => {
    const res = mockRes();
    await submitLocationVoteController(
      req({ params: { tripid: "t1" }, body: { votes: ["a", "b"] } }), res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 if trip is closed", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("archived" as any);
    await submitLocationVoteController(
      req({ params: { tripid: "t1" }, body: { votes: ["a", "b", "c"] } }), res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TRIP_CLOSED" }));
  });

  it("returns 500 on unexpected error", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("open" as any);
    mockVoteService.voteLocation.mockRejectedValueOnce(new Error("unexpected"));
    mockTripService.closeTripService.mockResolvedValueOnce({ success: true } as any);
    await submitLocationVoteController(
        req({ params: { tripid: "t1" }, body: { votes: ["a", "b", "c"] } }), res
    );
    expect(res.status).toHaveBeenCalledWith(500);
    });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockVoteService.checkTripStatus.mockResolvedValueOnce("open" as any);
    mockVoteService.voteLocation.mockResolvedValueOnce([
      { province_name: "Bangkok", total_score: 5 }
    ] as any);
    mockTripService.closeTripService.mockResolvedValueOnce({ success: true } as any);
    await submitLocationVoteController(
      req({ params: { tripid: "t1" }, body: { votes: ["a", "b", "c"] } }), res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "LOCATION_VOTED" }));
  });
});
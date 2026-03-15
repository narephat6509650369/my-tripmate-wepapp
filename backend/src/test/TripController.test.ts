import { vi, describe, it, expect, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  addTripController,
  deleteTripController,
  requestJoinTripController,
  getPendingRequestsController,
  approveMemberController,
  removeMemberController,
  getTripDetailController,
} from "../controllers/TripController.js";

import * as tripService from "../services/tripService.js";
import * as tripModel from "../models/tripModel.js";

vi.mock("../services/tripService.js");
vi.mock("../models/tripModel.js");

const mockTripService = tripService as import("vitest").Mocked<typeof tripService>;
const mockTripModel = tripModel as import("vitest").Mocked<typeof tripModel>;

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const req = (overrides = {}) =>
  ({ user: { user_id: "owner1" }, params: {}, body: {}, query: {}, ...overrides } as unknown as Request);

const noAuth = (overrides = {}) =>
  ({ user: undefined, params: {}, body: {}, query: {}, ...overrides } as unknown as Request);

beforeEach(() => vi.clearAllMocks());

// addTrip, deleteTrip, requestJoinTrip, getPendingRequests, approveMember, removeMember, getTripDetail

// ==================== addTripController ====================

describe("addTripController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await addTripController(noAuth({ body: { trip_name: "Trip A", num_days: 3 } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 if trip_name is missing", async () => {
    const res = mockRes();
    await addTripController(req({ body: { num_days: 3 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 201 on success", async () => {
    const res = mockRes();
    mockTripService.addTrip.mockResolvedValueOnce({ success: true, data: { trip_id: "t1" } } as any);
    await addTripController(req({ body: { trip_name: "Trip A", num_days: 2 } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TRIP_CREATED" }));
  });
});

// ==================== deleteTripController ====================

describe("deleteTripController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await deleteTripController(noAuth({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 403 if user is not the owner", async () => {
    const res = mockRes();
    mockTripModel.findOwnerByTrip.mockResolvedValueOnce("other_user" as any);
    await deleteTripController(req({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 200 on successful delete", async () => {
    const res = mockRes();
    mockTripModel.findOwnerByTrip.mockResolvedValueOnce("owner1" as any);
    mockTripService.deleteTripService.mockResolvedValueOnce(undefined as any);
    await deleteTripController(req({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TRIP_DELETED" }));
  });
});

// ==================== requestJoinTripController ====================

describe("requestJoinTripController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await requestJoinTripController(noAuth({ body: { invite_code: "ABC123" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 if invite_code is missing", async () => {
    const res = mockRes();
    await requestJoinTripController(req({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockTripService.requestJoinTripByCode.mockResolvedValueOnce({
      success: true, message: "sent", trip_id: "t1", trip_name: "Trip A"
    } as any);
    await requestJoinTripController(req({ body: { invite_code: "VALID" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "REQUEST_SENT" }));
  });
});

// ==================== getPendingRequestsController ====================

describe("getPendingRequestsController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await getPendingRequestsController(noAuth({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockTripService.getPendingRequests.mockResolvedValueOnce({ success: true, data: [] } as any);
    await getPendingRequestsController(req({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ==================== approveMemberController ====================

describe("approveMemberController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await approveMemberController(noAuth({ params: { tripId: "t1", userId: "u2" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockTripService.approveMember.mockResolvedValueOnce({ success: true } as any);
    await approveMemberController(req({ params: { tripId: "t1", userId: "u2" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ==================== removeMemberController ====================

describe("removeMemberController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await removeMemberController(noAuth({ params: { tripId: "t1", memberId: "u2" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 403 if service fails", async () => {
    const res = mockRes();
    mockTripService.removeMemberService.mockResolvedValueOnce({ success: false, error: "forbidden" } as any);
    await removeMemberController(req({ params: { tripId: "t1", memberId: "u2" } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockTripService.removeMemberService.mockResolvedValueOnce({ success: true } as any);
    await removeMemberController(req({ params: { tripId: "t1", memberId: "u2" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TRIP_MEMBER_REMOVED" }));
  });
});

// ==================== getTripDetailController ====================

describe("getTripDetailController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await getTripDetailController(noAuth({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 403 if user is not a member", async () => {
    const res = mockRes();
    mockTripService.getTripDetail.mockResolvedValueOnce({
      success: true,
      data: { members: [{ user_id: "other_user" }] }
    } as any);
    await getTripDetailController(req({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 200 if user is a member", async () => {
    const res = mockRes();
    mockTripService.getTripDetail.mockResolvedValueOnce({
      success: true,
      data: { members: [{ user_id: "owner1" }] }
    } as any);
    await getTripDetailController(req({ params: { tripId: "t1" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TRIP_DETAIL_FETCHED" }));
  });
});
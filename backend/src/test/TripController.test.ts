import { describe, it, expect, beforeEach, vi } from "vitest";
import { removeMemberController } from "../controllers/TripController.js";
import {  removeMemberService  } from "../services/tripService.js";

// mock services
vi.mock("../services/tripService.js", () => ({
  fetchMyTrips: vi.fn(),
  fetchTripDetail: vi.fn(),
  joinTripServiceByCode: vi.fn(),
  removeMemberService: vi.fn(),
}));

describe("Trip Controller Tests", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { params: {}, body: {} };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    vi.clearAllMocks();
  });



  



  // Remove Member Tests

  it("removeMember → return 400 if trip_id missing", async () => {
    req.params = { member_id: "M123" };
    req.body = { owner_id: "U1" };

    await removeMemberController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "tripId and memberId are required"
    });
  });

  it("removeMember → return 400 if member_id missing", async () => {
    req.params = { trip_id: "T10" };
    req.body = { owner_id: "U1" };

    await removeMemberController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "tripId and memberId are required"
    });
  });

  it("removeMember → return 400 if owner_id missing", async () => {
    req.params = { trip_id: "T10", member_id: "M123" };
    req.body = {}; // ไม่มี owner_id

    await removeMemberController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "OwnerId are required"
    });
  });

  it("removeMember → return 400 if service returns error", async () => {
    req.params = { trip_id: "T10", member_id: "M123" };
    req.body = { owner_id: "U1" };

    (removeMemberService as any).mockResolvedValue({
      success: false,
      error: "Only owner can remove members"
    });

    await removeMemberController(req, res);

    expect(removeMemberService).toHaveBeenCalledWith({
      trip_id: "T10",
      member_id: "M123",
      owner_id: "U1"
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Only owner can remove members"
    });
  });

  it("removeMember → return 200 on success", async () => {
    req.params = { trip_id: "T10", member_id: "M123" };
    req.body = { owner_id: "U1" };

    (removeMemberService as any).mockResolvedValue({
      success: true
    });

    await removeMemberController(req, res);

    expect(removeMemberService).toHaveBeenCalledWith({
      trip_id: "T10",
      member_id: "M123",
      owner_id: "U1"
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Member removed successfully"
    });
  });


});






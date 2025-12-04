import { describe, it, expect, beforeEach, vi } from "vitest";
import { getMyTrips, getTripDetail, joinTripByCode, joinTripByLink,removeMemberController  } from "../controllers/TripController.js";
import { fetchMyTrips, fetchTripDetail, joinTripServiceByCode, joinTripServiceByLink, removeMemberService,  } from "../services/tripService.js";

// mock services
vi.mock("../services/tripService.js", () => ({
  fetchMyTrips: vi.fn(),
  fetchTripDetail: vi.fn(),
  joinTripServiceByCode: vi.fn(),
  joinTripServiceByLink : vi.fn(),
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


  // getMyTrips Tests
  it("should return 401 if user_id is missing", async () => {
    req.body = {}; // ไม่มี user_id

    await getMyTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("should return 200 and trips when user_id exists", async () => {
    req.body = { user_id: 123 };

    const mockTrips = [
      { trip_id: 1, trip_name: "Japan Trip" },
    ];

    // mock service response
    (fetchMyTrips as any).mockResolvedValue(mockTrips);

    await getMyTrips(req, res);

    expect(fetchMyTrips).toHaveBeenCalledWith(123);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockTrips,
    });
  });

  // getTripDetail Tests
  it("should return trip detail by tripId", async () => {
  req.params = { trip_Id: 345 };

  const mockTrip = {
    trip_id: 1,
    user_id: 345,
    trip_name: "Japan Trip",
  };

  (fetchTripDetail as any).mockResolvedValue(mockTrip);

  await getTripDetail(req, res);

  expect(fetchTripDetail).toHaveBeenCalledWith(345);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({
    success: true,
    data: mockTrip,
  });
});

  // getTripDetail Tests
  it("should return 400 if trip_id is missing", async () => {
    req.params = {}; // ไม่มี trip_id

    await getTripDetail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "tripId is required" });
});

  // joinTripByCode
  it("joinTripByCode → return 400 if invite_code missing", async () => {
    req.body = { user_id: "U1" }; // ขาด invite_code

    await joinTripByCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "invite code is required" });
  });

  it("joinTripByCode → return 400 if user_id missing", async () => {
    req.body = { invite_code: "ABC123" }; // ขาด user_id

    await joinTripByCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "user id is required" });
  });

  it("joinTripByCode → return 200 with success", async () => {
    req.body = { invite_code: "ABC123", user_id: "U1" };

    const mockResult = { trip_id: 10, role: "member" };

    (joinTripServiceByCode as any).mockResolvedValue(mockResult);

    await joinTripByCode(req, res);

    expect(joinTripServiceByCode).toHaveBeenCalledWith("ABC123", "U1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Joined trip successfully",
      data: mockResult,
    });
  });

  // joinTripByLink
  it("joinTripByLink → return 400 if trip_id missing", async () => {
    req.params = {}; // ไม่มี trip_id
    req.body = "U1";

    await joinTripByLink(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "trip id is required" });
  });

  it("joinTripByLink → return 400 if user_id missing", async () => {
    req.params = { trip_id: "T10" };
    req.body = ""; // body ว่าง

    await joinTripByLink(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "user id is required" });
  });

  it("joinTripByLink → return 200 with success", async () => {
    req.params = { trip_id: "T10" };
    req.body = "U1";

    const mockResult = { trip_id: "T10", user_id: "U1" };

    (joinTripServiceByLink as any).mockResolvedValue(mockResult);

    await joinTripByLink(req, res);

    expect(joinTripServiceByLink).toHaveBeenCalledWith("T10", "U1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Joined trip successfully",
      data: mockResult,
    });
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






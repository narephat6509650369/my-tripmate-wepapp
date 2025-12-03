import { describe, it, expect, beforeEach, vi } from "vitest";
import { getMyTrips, getTripDetail } from "../controllers/TripController.js";
import { fetchMyTrips, fetchTripDetail } from "../services/tripService.js";

// mock services
vi.mock("../services/tripService.js", () => ({
  fetchMyTrips: vi.fn(),
  fetchTripDetail: vi.fn(),
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

  // ------------------------------
  // getMyTrips Tests
  // ------------------------------
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

  // ------------------------------
  // getTripDetail Tests
  // ------------------------------
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

  // ------------------------------
  // getTripDetail Tests
  // ------------------------------
  it("should return 400 if trip_id is missing", async () => {
    req.params = {}; // ไม่มี trip_id

    await getTripDetail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "tripId is required" });
});

});






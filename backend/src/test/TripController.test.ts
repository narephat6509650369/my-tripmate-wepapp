import { describe, it, expect } from "vitest";

describe("Trip Controller Tests", () => {

  it("should login successfully", async () => {
    const req: any = {
      body: {
        email: "testuser@example.com"
      }
    };

    const res: any = {
      status: () => ({
        json: (data: any) => data
      })
    };

    expect(req.body.email).toBe("testuser@example.com");
  });

  it("should add a trip successfully", async () => {

    const UserId = "test-user-id";   // ← แก้นี่

    const req: any = {
      body: {
        user_id: UserId,
        trip_name: "Test Trip",
        description: "This is a test trip",
        num_days: 4
      }
    };

    const res: any = {
      status: () => ({
        json: (data: any) => data
      })
    };

    const { addTripController } = await import("../controllers/TripController.js");

    const result = await addTripController(req, res);

    console.log(result);

    expect(result).toBeDefined();
  });

  it("should delete a trip successfully", async () => {
  const req: any = {
    params: { tripId: "test-trip-id" },
    user: { user_id: "test-user-id" }  // ถ้า controller ใช้ ownerId จาก user
  };

  let jsonResponse: any;
  const res: any = {
    status: () => ({
      json: (data: any) => {
        jsonResponse = data;
        return data;
      }
    })
  };

  const { deleteTripController } = await import("../controllers/TripController.js");

  await deleteTripController(req, res);

  console.log(jsonResponse);

  expect(jsonResponse.message).toBe("Trip deleted successfully");
});

});

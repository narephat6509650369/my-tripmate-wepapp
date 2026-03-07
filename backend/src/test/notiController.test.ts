import { vi, describe, it, expect, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  getUserNotiController,
  markAllNotificationAsReadController,
} from "../controllers/notiController.js";
import notiservice from "../services/notiService.js";

vi.mock("../services/notiService.js");
const mockNotiService = notiservice as import("vitest").Mocked<typeof notiservice>;

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const authReq = (overrides = {}) =>
  ({ user: { user_id: "user1" }, params: {}, body: {}, ...overrides } as unknown as Request);

const noAuthReq = (overrides = {}) =>
  ({ user: undefined, params: {}, body: {}, ...overrides } as unknown as Request);

beforeEach(() => vi.clearAllMocks());

// getUserNotiController, markAllNotificationAsReadController

// ==================== getUserNotiController ====================

describe("getUserNotiController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await getUserNotiController(noAuthReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "AUTH_UNAUTHORIZED" }));
  });

  it("returns 200 with notifications on success", async () => {
    const res = mockRes();
    mockNotiService.getUserNotifications.mockResolvedValueOnce({
      success: true,
      notifications: [{ id: "n1", message: "hello" }]
    } as any);
    await getUserNotiController(authReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTI_FETCH_SUCCESS" }));
  });
});

// ==================== markAllNotificationAsReadController ====================

describe("markAllNotificationAsReadController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await markAllNotificationAsReadController(noAuthReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockNotiService.markNotificationAsRead.mockResolvedValueOnce({ success: true } as any);
    await markAllNotificationAsReadController(authReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTI_MARK_ALL_SUCCESS" }));
  });
});
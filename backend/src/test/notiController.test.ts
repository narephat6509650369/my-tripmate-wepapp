import { vi, describe, it, expect, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  getUserNotiController,
  markAllNotificationAsReadController,
  markNotificationAsReadController,
  getUnreadCountController,
  deleteNotificationController,
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

// getUserNotiController, markAllNotificationAsReadController, markNotificationAsReadController, getUnreadCountController, deleteNotificationController

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

// ==================== markNotificationAsReadController ====================

describe("markNotificationAsReadController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await markNotificationAsReadController(noAuthReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "AUTH_UNAUTHORIZED" }));
  });

  it("returns 400 if notification id is missing", async () => {
    const res = mockRes();
    await markNotificationAsReadController(authReq({ params: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTI_ID_REQUIRED" }));
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockNotiService.markNotificationAsRead.mockResolvedValueOnce({ success: true } as any);
    await markNotificationAsReadController(authReq({ params: { id: "n1" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTI_MARK_SUCCESS" }));
  });
});

// ==================== getUnreadCountController ====================

describe("getUnreadCountController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await getUnreadCountController(noAuthReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "AUTH_UNAUTHORIZED" }));
  });

  it("returns 200 with unread count on success", async () => {
    const res = mockRes();
    mockNotiService.getUnreadCount.mockResolvedValueOnce({ success: true, count: 3 } as any);
    await getUnreadCountController(authReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "NOTI_COUNT_SUCCESS",
        data: { unreadCount: 3 }
      })
    );
  });
});

// ==================== deleteNotificationController ====================

describe("deleteNotificationController", () => {
  it("returns 401 if not authenticated", async () => {
    const res = mockRes();
    await deleteNotificationController(noAuthReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "AUTH_UNAUTHORIZED" }));
  });

  it("returns 400 if notification id is missing", async () => {
    const res = mockRes();
    await deleteNotificationController(authReq({ params: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTI_ID_REQUIRED" }));
  });

  it("returns 400 if service fails", async () => {
    const res = mockRes();
    mockNotiService.deleteNotification.mockResolvedValueOnce({
      success: false,
      message: "Not found"
    } as any);
    await deleteNotificationController(authReq({ params: { id: "n1" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTI_DELETE_FAILED" }));
  });

  it("returns 200 on success", async () => {
    const res = mockRes();
    mockNotiService.deleteNotification.mockResolvedValueOnce({ success: true } as any);
    await deleteNotificationController(authReq({ params: { id: "n1" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTI_DELETE_SUCCESS" }));
  });
});
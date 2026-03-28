import { vi, describe, it, expect, beforeEach } from "vitest";
import { Request, Response } from "express";
import { googleLogin, logout, getMe } from "../controllers/authController.js";
import { googleLoginService } from "../services/authService.js";

vi.mock("../services/authService.js");
const mockGoogleLoginService = googleLoginService as import("vitest").MockedFunction<typeof googleLoginService>;

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
};

// googleLogin, logout, getMe
// ==================== googleLogin ====================

describe("googleLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 if access_token is missing", async () => {
    const req = { body: {} } as Request;
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "MISSING_FIELD" })
    );
  });

  it("should set cookies and return 200 on successful login", async () => {
    const req = { body: { access_token: "valid_token" } } as Request;
    const res = mockRes();

    mockGoogleLoginService.mockResolvedValueOnce({
      accessToken: "access_jwt",
      refreshToken: "refresh_jwt",
      user: { user_id: "u1", email: "test@example.com" }
    } as any);

    await googleLogin(req, res);

    expect(res.cookie).toHaveBeenCalledWith("accessToken", "access_jwt", expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh_jwt", expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "AUTH_LOGIN_SUCCESS",
        data: { user: { user_id: "u1", email: "test@example.com" } }
      })
    );
  });

  it("should return 401 if googleLoginService throws", async () => {
    const req = { body: { access_token: "bad_token" } } as Request;
    const res = mockRes();

    mockGoogleLoginService.mockRejectedValueOnce(new Error("invalid token"));

    await googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "AUTH_INVALID_TOKEN" })
    );
  });
});

// ==================== logout ====================

describe("logout", () => {
  it("should clear cookies and return 200", () => {
    const req = {} as Request;
    const res = mockRes();

    logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith("accessToken", expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "AUTH_LOGOUT_SUCCESS" })
    );
  });
});

// ==================== getMe ====================

describe("getMe", () => {
  it("should return the authenticated user", async () => {
    const req = { user: { user_id: "u1", email: "test@example.com" } } as any;
    const res = mockRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: req.user })
    );
  });
});
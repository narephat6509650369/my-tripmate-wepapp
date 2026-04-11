import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// ============================================================================
// GET CURRENT USER (ใช้ session จาก passport)
// ============================================================================
export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  return res.status(200).json({
    success: true,
    data: req.user,
  });
};

// ============================================================================
// LOGOUT (ลบ session แทนการลบ JWT)
// ============================================================================
export const logout = (req: Request, res: Response) => {
  try {
    // ลบ JWT cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};


// ============================================================================
// GOOGLE CALLBACK
// ============================================================================
export const googleCallback = (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    const accessToken = jwt.sign(
      { user_id: user.user_id, email: user.email, jti: randomUUID() },
      process.env.ACCESS_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { sub: user.user_id, jti: randomUUID() },
      process.env.REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // ✅ เปลี่ยนเป็น sign JWT แทน Map
    const tempToken = jwt.sign(
      { accessToken, refreshToken },
      process.env.ACCESS_SECRET!,
      { expiresIn: "2m" } // หมดอายุใน 2 นาที
    );

    const redirect = req.query.state || "/homepage";
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${tempToken}&redirect=${redirect}`
    );

  } catch (err) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// ============================================================================
// EXCHANGE TEMP TOKEN → SET COOKIE
// ============================================================================
export const exchangeToken = (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }

  try {
    // verify + decode ตรงๆ ไม่ต้องใช้ Map
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as {
      accessToken: string;
      refreshToken: string;
    };

    res.cookie("accessToken", decoded.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", decoded.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    // JWT หมดอายุหรือ invalid
    return res.status(401).json({ success: false, message: "Token expired or invalid" });
  }
};

// ============================================================================
// REFRESH TOKEN (ถ้าจำเป็น แต่ถ้าใช้ session แทน JWT อาจไม่จำเป็น)
// ============================================================================
export const refreshToken = (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token",
      });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET!);

    // create new access token
    const newAccessToken = jwt.sign(
      {
        user_id: (decoded as any).sub,
        jti: randomUUID(),
      },
      process.env.ACCESS_SECRET!,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
    });

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};
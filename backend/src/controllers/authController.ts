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
      domain: ".onrender.com",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".onrender.com",
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
// GOOGLE CALLBACK (หลังจาก Google auth ผ่านแล้ว จะมาที่นี่เพื่อสร้าง JWT และ set cookie)
// ============================================================================
export const googleCallback = (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // create JWT
    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        jti: randomUUID(),
      },
      process.env.ACCESS_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.user_id,
        jti: randomUUID(),
      },
      process.env.REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // set cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".onrender.com",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".onrender.com",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // redirect
    const redirect = req.query.state || "/homepage";
    console.log("Redirecting to:", `${process.env.FRONTEND_URL}${redirect}`);
    return res.redirect(`${process.env.FRONTEND_URL}${redirect}`);

  } catch (err) {
    console.error(err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

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
      domain: ".onrender.com",
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
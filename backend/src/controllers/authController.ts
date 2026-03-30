import type { Request, Response } from "express";
import { googleLoginService } from "../services/authService.js";
import type { AuthRequest   } from "../middleware/validate.js";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "access_token is required",
      });
    }

    const result = await googleLoginService(access_token);

    const isProduction = process.env.NODE_ENV === "production";

res.cookie("accessToken", result.accessToken, {
  httpOnly: true,
  secure: isProduction, // true บน production, false บน localhost
  sameSite: isProduction ? "none" : "lax", // ลองใช้ lax ใน dev
  domain: ".onrender.com", 
  maxAge: 15 * 60 * 1000
});

res.cookie("refreshToken", result.refreshToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  domain: ".onrender.com", 
  maxAge: 7 * 24 * 60 * 60 * 1000
});

    return res.status(200).json({
      success: true,
      code: "AUTH_LOGIN_SUCCESS",
      message: "Login successful",
      data: {
        user: {
          user_id: result.user.user_id,
          email: result.user.email
        }
      }
    });

    
  } catch (err: any) {
    console.error("Google API error:", err.response?.data || err.message);
    return res.status(401).json({
      success: false,
      code: "AUTH_INVALID_TOKEN",
      message: "Google login failed",
      error: {
        detail: err.message
      }
    });
    
  }
};

export const logout = (req: Request, res: Response) => {  
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none"
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none"
  });
  res.status(200).json({
    success: true,
    code: "AUTH_LOGOUT_SUCCESS",
    message: "Logout successful"
  });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    data: req.user
  });
};

export const refreshToken = (req: Request, res: Response) => {

  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      code: "NO_REFRESH_TOKEN"
    });
  }

  try {

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!
    ) as any;

    const newAccessToken = jwt.sign(
      {
        user_id: decoded.sub,
        jti: randomUUID()
      },
      process.env.ACCESS_SECRET!,
      { expiresIn: "15m" }
    );

    const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: ".onrender.com",
    maxAge: 15 * 60 * 1000
  });

    return res.json({
      success: true
    });

  } catch (err) {

    return res.status(401).json({
      success: false,
      code: "INVALID_REFRESH_TOKEN"
    });

  }
};
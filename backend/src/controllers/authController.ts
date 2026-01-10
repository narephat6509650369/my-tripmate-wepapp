import type { Request, Response } from "express";
import { googleLoginService } from "../services/authService.js";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "access_token is required",
        error: { field: "access_token" }
      });
    }

    const jwtToken = await googleLoginService(access_token);

    return res.status(200).json({
      success: true,
      code: "AUTH_LOGIN_SUCCESS",
      message: "Login successful",
      data: {
        token: jwtToken.token,
        user: {
          user_id: jwtToken.user.user_id,
          email: jwtToken.user.email
        }
      }
    });

  } catch (err: any) {
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



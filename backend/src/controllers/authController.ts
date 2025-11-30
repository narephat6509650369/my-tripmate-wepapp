import type { Request, Response } from "express";
import { googleLoginService } from "../services/authService.js";
import user from "../routes/user.js";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;
    const jwtToken = await googleLoginService(access_token);
    res.json({
      token: jwtToken.token,
      user: {
        id: jwtToken.user.user_id,
        email: jwtToken.user.email,
      }
});

  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};


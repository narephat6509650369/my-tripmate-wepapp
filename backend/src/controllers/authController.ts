import type { Request, Response } from "express";
import { googleLoginService } from "../services/authService.js";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;
    const jwtToken = await googleLoginService(access_token);
    res.json({ token: jwtToken });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};


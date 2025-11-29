import type { Request, Response, NextFunction } from "express";

export const validateGoogleLogin = (req: Request, res: Response, next: NextFunction) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: "access_token is required" });
  }
  next();
};
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
  user?: any;
}

export const validateGoogleLogin = (req: Request, res: Response, next: NextFunction) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: "access_token is required" });
  }
  next();
};

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false });
  }
};
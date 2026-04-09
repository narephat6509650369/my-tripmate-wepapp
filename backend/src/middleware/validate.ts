import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: any;
}

// ============================================================================
// CHECK AUTH (แทน verifyToken)
// ============================================================================
import jwt from "jsonwebtoken";

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!);

    req.user = decoded; 

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
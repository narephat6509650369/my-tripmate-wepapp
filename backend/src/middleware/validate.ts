import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: any;
}

// ============================================================================
// CHECK AUTH (แทน verifyToken)
// ============================================================================
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "../express.d.ts";

export const auth = (req: Request,res: Response,next: NextFunction) => {

  // อ่านจาก cookie แทน header
  const token = req.cookies?.accessToken;


  if (!token) {
    return res.status(401).json({
      error: "Unauthorized: No access token"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_SECRET!
    ) as JwtPayload;

    req.user = decoded;
    next();

    //console.log("COOKIE TOKEN:", token);

    //console.log("VERIFY ACCESS_SECRET:", process.env.ACCESS_SECRET);

  } catch (err) {
    console.log("❌ JWT verify error:", err);
    return res.status(401).json({
      error: "Invalid or expired access token"
    });
  }
};



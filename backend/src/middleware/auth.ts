import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "../express.d.ts";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  console.log("Authorization header:", req.headers.authorization);

  const token = req.headers.authorization?.split(" ")[1];

  console.log("Extracted token:", token);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    console.log("Decoded JWT:", decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify failed:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

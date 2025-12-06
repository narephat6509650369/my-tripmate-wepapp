import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "../express.js"; 

export const auth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        // หากไม่มี Token ให้แจ้ง Unauthorized
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        // ตรวจสอบ JWT และใช้ Type Assertion ให้เป็น JwtPayload
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        
        // กำหนดค่า req.user
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

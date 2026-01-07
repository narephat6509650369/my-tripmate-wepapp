import "express";

export interface JwtPayload {
    userId: string;
    email: string;
    // อาจมี property อื่นๆ จาก JWT payload เช่น iat, exp
}
declare global {
  namespace Express {
    interface User {
      userId: string;
      email?: string;
    }
  }
}

import "express";

export interface JwtPayload {
  userId: string;
  email: string;
  jti?: string;
}

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      jti?: string;
    }
  }
}


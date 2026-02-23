import "express";

export interface JwtPayload {
  user_id: string;
  email: string;
  jti?: string;
}

declare global {
  namespace Express {
    interface User {
      user_id: string;
      email: string;
      jti?: string;
    }
  }
}


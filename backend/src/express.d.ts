import "express";

export interface JwtPayload {
  user_id: string;
  email: string;
  jti?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
    cookies: { [key: string]: string };
  }
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


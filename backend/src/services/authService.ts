import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { findOrCreateUser } from "../models/userModel.js";
import axios from "axios";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLoginService = async (access_token: string): Promise<string> => {
  
  // ดึง user profile จาก Google ด้วย access_token
  const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const payload = res.data;
  if (!payload) throw new Error("Invalid Google token");

  // บันทึกหรืออัปเดต user ใน DB
  const user = await findOrCreateUser({
    email: payload.email!,
    fullName: payload.name!,
    avatarUrl: payload.picture!,
  });

  // สร้าง JWT ของเรา
  const token = jwt.sign(
    { userId: user.user_id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return token;
};

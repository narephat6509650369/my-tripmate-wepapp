import jwt from "jsonwebtoken";
import { findOrCreateUser } from "../models/userModel.js";
import axios from "axios";
import { randomUUID } from "crypto";

export const googleLoginService = async (access_token: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> => {

  const res = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  const payload = res.data;
  if (!payload) throw new Error("Invalid Google token");

  const user = await findOrCreateUser({
    email: payload.email!,
    fullName: payload.name!,
    google_id: payload.sub!,
    avatarUrl: payload.picture!,
  });

  // Access Token (สั้น)
  const accessToken = jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      jti: randomUUID()
    },
    process.env.ACCESS_SECRET!,
    { expiresIn: "15m" }
  );

  // Refresh Token (ยาว)
  const refreshToken = jwt.sign(
    {
      sub: user.user_id,
      jti: randomUUID()
    },
    process.env.REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

  //console.log("SIGN ACCESS_SECRET:", process.env.ACCESS_SECRET);
  //console.log("SIGNED ACCESS TOKEN:", accessToken);

  return { accessToken, refreshToken, user };
};

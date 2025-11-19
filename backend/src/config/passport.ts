import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!, // http://localhost:5000/api/auth/google/callback
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 🔹 ตรวจว่า user มีอยู่ในระบบหรือยัง
        const [rows]: any = await pool.query(
          "SELECT * FROM users WHERE google_id = ? OR email = ?",
          [profile.id, profile.emails?.[0]?.value]
        );

        let user;

        if (rows.length > 0) {
          // 🔹 ถ้ามี user เดิม → ใช้ข้อมูลนั้นเลย
          user = rows[0];
        } else {
          // 🔹 ถ้ายังไม่มี user → สร้างใหม่
          const [result]: any = await pool.query(
            `INSERT INTO users (email, name, google_id, profile_pic, email_verified, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
              profile.emails?.[0]?.value,
              profile.displayName,
              profile.id,
              profile.photos?.[0]?.value || null,
              1, // ถือว่า verified แล้วเพราะมาจาก Google
            ]
          );

          user = {
            id: result.insertId,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            google_id: profile.id,
            profile_pic: profile.photos?.[0]?.value || null,
            redirectUrl: `http://localhost:5173/?/login/success=${generateToken(result.insertId)}`
          };
        }
        return done(null, user);
      } catch (err) {
        console.error("❌ Error in GoogleStrategy:", err);
        return done(err, '');
      }
    }
  )
);

export default passport;






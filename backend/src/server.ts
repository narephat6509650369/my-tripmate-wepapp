// เปลี่ยนจาก require เป็น import
import express, { type Request, type Response } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import dotenv from "dotenv";
import { pool } from "./db.js"; // ต้องมี .js เพราะเป็น ESM
import { dirname, join } from "path/win32";
import { fileURLToPath } from "url";


// แปลง import.meta.url → __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// โหลด .env
dotenv.config({ path: join(__dirname, "../.env") });

const app = express();
app.use(express.json());

// ตั้งค่า session
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
  })
);

// init passport
app.use(passport.initialize());
app.use(passport.session());

// ตั้งค่า Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/auth/google/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const [rows]: any = await pool.query("SELECT * FROM users WHERE google_id = ?", [
          profile.id,
        ]);

        let user: any;
        if (rows.length === 0) {
          // ถ้า user ยังไม่มีใน DB → insert
          const [result]: any = await pool.query(
            "INSERT INTO users (email, name, google_id) VALUES (?, ?, ?)",
            [profile.emails?.[0]?.value ?? null, profile.displayName, profile.id]
          );
          user = {
                    id: result.insertId,
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value ?? null
                 };
        } else {
          user = rows[0]
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// บันทึกข้อมูล user ใน session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

// Route login google
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback จาก google
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req: Request, res: Response) => {
    res.send("Login success with Google!");
  }
);

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
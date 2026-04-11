import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";
import http from "http";
import path from "path";

async function bootstrap() {
  try {
    dotenv.config();

    const app = express();
    const server = http.createServer(app);

    await import("./config/passport.config.js");

    // CORS (สำคัญมาก)
    app.use(cors({
      origin: process.env.FRONTEND_URL||true,
      credentials: true,
    }));

    // middleware พื้นฐาน
    app.use(cookieParser());
    app.use(express.json());
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: "lax", 
        },
      })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // log cookies (ย้ายขึ้นมา)
    app.use((req, res, next) => {
      next();
    });

    // socket
    const { initSocket } = await import("./socket/socket.js");
    initSocket(server);

    // routes
    const authRoutes = (await import("./routes/user.js")).default;
    const tripRoutes = (await import("./routes/trip.js")).default;
    const voteRoutes = (await import("./routes/vote.js")).default;
    const notiRoutes = (await import("./routes/noti.js")).default;

    app.use("/api/auth", authRoutes);
    app.use("/api/trips", tripRoutes);
    app.use("/api/votes", voteRoutes);
    app.use("/api/noti", notiRoutes);

    // health check (สำคัญสำหรับ Render)
    app.get("/", (req, res) => {
      res.send("Server is running");
    });

    const __dirname = new URL('.', import.meta.url).pathname;

    app.use(express.static(path.join(__dirname, "../../frontend/dist")));

    app.use((req, res) => {
      res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
    });

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
      console.log("GOOGLE_CALLBACK_URL:", process.env.GOOGLE_CALLBACK_URL);
    });

  } catch (err) {
    console.error("🔥 Backend bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import http from "http";

async function bootstrap() {
  try {
    dotenv.config();

    const app = express();
    const server = http.createServer(app);

    const { initSocket } = await import("./socket/socket.js");
    initSocket(server);

    app.set('trust proxy', 1);

    const allowedOrigins = [
      process.env.FRONTEND_URL || "https://my-tripmate.netlify.app",
      "http://localhost:5173"
    ];

    app.use(cors({
      origin: (origin, callback) => {
      console.log("🌍 Origin:", origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("❌ Blocked by CORS:", origin);
        callback(null, false);
      }
      },
      credentials: true
    }));

    app.use(cookieParser());
    app.use(express.json());
    app.use(passport.initialize());

    const authRoutes = (await import("./routes/user.js")).default;
    const tripRoutes = (await import("./routes/trip.js")).default;
    const voteRoutes = (await import("./routes/vote.js")).default;
    const notiRoutes = (await import("./routes/noti.js")).default;


    app.use("/api/auth", authRoutes);
    app.use("/api/trips", tripRoutes);
    app.use("/api/votes", voteRoutes);
    app.use("/api/noti", notiRoutes);


    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (err) {
    console.error("🔥 Backend bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();

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

    // === CORS — must be first, before everything ===
    const corsOptions = {
      origin: "https://my-tripmate-wepapp-1.onrender.com",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    app.options("*", cors(corsOptions)); // ← preflight handler FIRST
    app.use(cors(corsOptions));          // ← then general CORS middleware

    // === Other middleware ===
    app.use(cookieParser());
    app.use(express.json());
    app.use(passport.initialize());

    // === WebSocket — after CORS is set up ===
    const { initSocket } = await import("./socket/socket.js");
    initSocket(server);

    // === Routes ===
    const authRoutes = (await import("./routes/user.js")).default;
    const tripRoutes = (await import("./routes/trip.js")).default;
    const voteRoutes = (await import("./routes/vote.js")).default;
    const notiRoutes = (await import("./routes/noti.js")).default;
    const { setupSwagger } = await import("./config/swagger.js");

    app.use("/api/auth", authRoutes);
    app.use("/api/trips", tripRoutes);
    app.use("/api/votes", voteRoutes);
    app.use("/api/noti", notiRoutes);

    setupSwagger(app);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("🔥 Backend bootstrap failed:", err);
    process.exit(1);
  }
}
  /*
    app.use(cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true
    }));
    */

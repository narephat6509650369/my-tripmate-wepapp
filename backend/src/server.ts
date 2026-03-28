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

    // Initialize WebSocket (ถ้ามี)
    const { initSocket } = await import("./socket/socket.js");
    initSocket(server);

    // === CORS configuration ===
    const allowedOrigins = [
      "https://my-tripmate-wepapp-1.onrender.com", // production frontend
      // "http://localhost:5173", // dev frontend (uncomment for local dev)
    ];
    const corsOptions = {
      origin: (origin: string | undefined, callback: any) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    };

    // ใช้ CORS middleware สำหรับทุก route
    app.use(cors(corsOptions));

    // ตอบ preflight request สำหรับทุก route (OPTIONS)
    app.options("/*", cors(corsOptions));

    // === Middleware อื่น ๆ ===
    app.use(cookieParser());
    app.use(express.json());
    app.use(passport.initialize());

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

    // Swagger
    setupSwagger(app);

    // === Start server ===
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("🔥 Backend bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();
  /*
    app.use(cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true
    }));
    */

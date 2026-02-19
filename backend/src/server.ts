import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";


async function bootstrap() {
  try {
    dotenv.config();

    const app = express();

    app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }));

    app.use(cookieParser());
    app.use(express.json());
    app.use(passport.initialize());
    
    // ⬇️ import routes หลัง dotenv + passport
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
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    //console.log("JWT_SECRET:", process.env.JWT_SECRET);


  } catch (err) {
    console.error("🔥 Backend bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();

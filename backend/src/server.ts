import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";

async function bootstrap() {
  try {
    dotenv.config();

    const app = express();

    app.use(cors({
      origin: "http://localhost:5173",
      credentials: true
    }));
    app.use(express.json());
    app.use(passport.initialize());

    // ⬇️ import routes หลัง dotenv + passport
    const authRoutes = (await import("./routes/user.js")).default;
    const tripRoutes = (await import("./routes/trip.js")).default;
    const { setupSwagger } = await import("./config/swagger.js");

    app.use("/api/auth", authRoutes);
    app.use("/api/trips", tripRoutes);

    setupSwagger(app);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("🔥 Backend bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();

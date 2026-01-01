import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import { setupSwagger } from "./config/swagger.js";
import authRoutes from "./routes/user.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

setupSwagger(app);

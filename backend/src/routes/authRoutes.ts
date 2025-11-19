import express from "express";
import passport from "passport";
import { register, getMe, googleCallback, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { generateToken } from "../utils/jwt.js";
import type { User } from "../models/User.js";

const router = express.Router();

// 🔹 Register
router.post("/register", register);

// 🔹 Get current user
router.get("/me", authMiddleware, getMe);

// 🔹 Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔹 Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/login/failed", session: false }),
  googleCallback // ✅ ใช้ controller แทน inline
);

/*
// 🔹 Login failed
router.get("/login/failed", (req, res) => {
  res.status(401).json({ error: "Google login failed" });
});

// 🔹 Login success (test endpoint)
router.get("/login/success", (req, res) => {
  const user = req.user as User;
  if (user) {
    const token = generateToken(user.id);
    res.json({ token });
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
});
*/
// 🔹 Logout
router.get("/logout", logout);

export default router;


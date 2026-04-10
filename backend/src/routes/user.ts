import express from "express";
import passport from "passport";
import { requireAuth } from "../middleware/validate.js";
import { logout, getMe, googleCallback, refreshToken } from "../controllers/authController.js";

const router = express.Router();

// ============================================================================
// ไป Google
// ============================================================================
router.get("/google",
  (req, res, next) => {
    const redirect = req.query.redirect || "/homepage";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  }
);

router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false, // สำคัญ
  }),
  googleCallback // ให้ตัวนี้จัดการทุกอย่าง
);

// ============================================================================
// GET CURRENT USER
// ============================================================================
router.get("/me", requireAuth, getMe);

// ============================================================================
// REFRESH TOKEN (ถ้าจำเป็น แต่ถ้าใช้ session แทน JWT อาจไม่จำเป็น)
// ============================================================================
router.post("/refresh", refreshToken);

// ============================================================================
// LOGOUT
// ============================================================================
router.post("/logout", logout);

export default router;
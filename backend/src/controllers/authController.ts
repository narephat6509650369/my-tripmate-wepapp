import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/email.js";
import passport from "passport";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & OAuth APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         google_id:
 *           type: string
 *         profile_pic:
 *           type: string
 *         email_verified:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

export const register = async (req: Request, res: Response) => {
  const { name, email, google_id } = req.body;

  try {
    const [existing]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const [result]: any = await pool.query(
      `INSERT INTO users (name, email, google_id, email_verified)
       VALUES (?, ?, ?, ?)`,
      [name, email, google_id, 1]
    );

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const link = `http://localhost:5173/verify?token=${verificationToken}`;
    await sendVerificationEmail(email, link);

    res.status(201).json({
      message: "Registered successfully. Please verify your email.",
      user: {
        id: result.insertId,
        name,
        email,
        email_verified: 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
};


export const googleCallback = (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "User not found" });
  const token = generateToken(user.id);
  const verified = user.email_verified ? 1 : 0;
  res.redirect(`http://localhost:5173/google-success?token=${token}&email_verified=${verified}`);
};


export const logout = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    console.log("token before logout:", req.headers.authorization);

  });
};


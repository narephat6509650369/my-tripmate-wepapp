import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateUser } from "../models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"), false);
        }

        const user = await findOrCreateUser({
          email,
          fullName: profile.displayName,
          google_id: profile.id,
          avatarUrl: profile.photos?.[0]?.value ?? null,
        });

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
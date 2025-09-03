import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { comparePasswords } from "./utils";
import cors from 'cors';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // use HTTPS in production
      sameSite: 'lax',  // helps with CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // for example, 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cors({
    origin: 'https://dd81d232-4ee2-44df-86d1-4afa8b7e8d35-00-22bqkgeov2xfr.kirk.replit.dev/', // or true for development
    credentials: true  // This is critical for cookies
  }));

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false);
        }
        
        if (!user.password) {
          console.error(`User ${username} has no password set`);
          return done(null, false);
        }
        
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.post("/api/change-password", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Alla fält krävs" });
    }

    storage.changePassword(req.user.id, currentPassword, newPassword)
      .then((success) => {
        if (!success) {
          return res.status(400).json({ message: "Nuvarande lösenord är felaktigt" });
        }
        res.json({ message: "Lösenord ändrat framgångsrikt" });
      })
      .catch((error) => {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Internt serverfel" });
      });
  });
}
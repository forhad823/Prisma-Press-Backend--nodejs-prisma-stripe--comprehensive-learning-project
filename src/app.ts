import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import config from "./config";

import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.route";
import { postRoutes } from "./modules/post/post.route";
import { commentRoutes } from "./modules/comment/comment.route";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { subscriptionRoutes } from "./modules/subscription/subscription.route";
import { stripe } from "./lib/stripe";
import { premiumRoutes } from "./modules/premium/premium.route";

const app: Application = express();

// middlewares
app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

// ─── STRIPE WEBHOOK — must receive RAW body BEFORE express.json() parses it ──
// Stripe needs to verify the request with its own HMAC signature.
// If express.json() runs first, the raw buffer is lost and verification fails.
app.use(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" })
);

// ─── Standard body parsers (applied after the raw webhook route) ──────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ------------- initial server check -------------------
app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World");
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/premium", premiumRoutes);

// implementing not found route (middleware)
app.use(notFound);

// implementing Global Error Handler middleware
app.use(globalErrorHandler);

export default app;

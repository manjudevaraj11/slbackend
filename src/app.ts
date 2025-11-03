import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import quoteRoutes from "./routes/quoteRoutes";
import dbHealthRoute from "./middleware/dbHeath";
import { globalRateLimiter } from "./middleware/rateLimiter";

const app = express();

// Middlewares
app.use(globalRateLimiter);
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://192.168.201.201:3000",
    ],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/v1", dbHealthRoute);
app.use("/api/v1", quoteRoutes);
app.use("/api/v1", authRoutes);

export default app;

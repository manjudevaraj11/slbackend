import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import quoteRoutes from "./routes/quoteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dbHealthRoute from "./middleware/dbHeath.js";
import {
  globalRateLimiter,
  // sensitiveLimiter,
} from "./middleware/rateLimiter.js";
import prisma from "./prisma.js";
// import { sendTestEmail } from "./services/EmailServiceTesting.js";

dotenv.config();

const app = express();
const PORT = process.env["PORT"] || 5000;

// Middlewares
app.use(globalRateLimiter);
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://192.168.201.201:3000",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/v1", dbHealthRoute);
app.use("/api/v1", quoteRoutes);
app.use("/api/v1", authRoutes);

// Start server only after DB connection
async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    console.log("reaced-here");
    process.exit(1); // exit if DB is not connected
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

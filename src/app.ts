import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import dbHealthRoute from "./middleware/dbHeath.js";
import contactMessageRoute from "./routes/contactMessageRoute.js";
import quoteRequestRoute from "./routes/quoteRequestRoutes.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";

const app = express();

app.set("trust proxy", 1);

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
app.use(requestContextMiddleware);
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/internal/v1", dbHealthRoute);
app.use("/internal/v1", authRoutes);
app.use("/internal/v1", contactMessageRoute);
app.use("/internal/v1", quoteRequestRoute);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

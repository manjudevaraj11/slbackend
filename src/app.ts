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
import helmet from "helmet";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: "sameorigin" },
  }),
);

app.disable("x-powered-by");

// Middlewares
app.use(globalRateLimiter);
app.use(
  cors({
    origin: ["https://securelogicgroup.co", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(requestContextMiddleware);
app.use(cookieParser());

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Routes
app.use("/internal/v1", dbHealthRoute);
app.use("/internal/v1", authRoutes);
app.use("/internal/v1", contactMessageRoute);
app.use("/internal/v1", quoteRequestRoute);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

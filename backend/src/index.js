/**
 * SafarAI Backend — Express API entry point.
 */
import express from "express";
import cors from "cors";
import config from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import searchRouter from "./routes/search.js";

const app = express();

// ─── Middleware ───────────────────────────
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);
app.use("/api", rateLimiter);

// ─── Routes ──────────────────────────────
app.use("/api/search", searchRouter);

app.get("/", (_req, res) => {
  res.json({ name: "SafarAI Travel Search API", status: "running" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

// ─── Global Error Handler (must be last) ─
app.use(errorHandler);

// ─── Start ───────────────────────────────
app.listen(config.port, () => {
  console.log(`🚀 SafarAI API running on http://localhost:${config.port} [${config.nodeEnv}]`);
});

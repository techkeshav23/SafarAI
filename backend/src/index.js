/**
 * Voyehack Backend - Intelligent Travel Search API
 * Node.js/Express server
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import searchRouter from "./routes/search.js";
import bookingRouter from "./routes/booking.js";
import dataRouter from "./routes/data.js";

// Note: agentService.js calls dotenv.config() at module level,
// so env vars are available by the time any route handler executes.
// All service modules read env vars lazily (inside functions, not at top level).
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/search", searchRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/data", dataRouter);

app.get("/", (req, res) => {
  res.json({ message: "Voyehack Travel Search API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`🚀 Voyehack API running on http://localhost:${PORT}`);
});

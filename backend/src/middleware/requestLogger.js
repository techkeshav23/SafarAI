/**
 * Request logging middleware.
 * Logs method, path, status, and response time.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log after response is sent
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? "31" : status >= 400 ? "33" : "32"; // red/yellow/green
    console.log(
      `\x1b[${color}m${req.method}\x1b[0m ${req.originalUrl} → ${status} (${duration}ms)`
    );
  });

  next();
}

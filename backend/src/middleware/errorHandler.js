/**
 * Global error-handling middleware for Express.
 * Must be registered AFTER all routes: app.use(errorHandler)
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Log full stack in development, short message in production
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.error(`[Error] ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(status).json({
    error: {
      message: status === 500 ? "Internal server error" : message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}

/**
 * Catch async errors in route handlers so they reach the global error handler.
 * Usage: router.post("/path", asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

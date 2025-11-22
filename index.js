import express from "express";
import cors from "cors";
import connectDB from "./db/db.js";
import { connectRedis } from "./db/redis.js";
import { swaggerUi, specs } from "./swagger.js";
import { errorHandler, notFound } from "./middleware/ErrorMiddleware.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import examSessionRoutes from "./routes/examSessionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import { ensureDBConnection } from "./middleware/DatabaseMiddleware.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-requested-with']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "CADNA Backend API is running!" });
});

app.use("/api/auth", ensureDBConnection, authRoutes);
app.use("/api/exams", ensureDBConnection, examRoutes);
app.use("/api/exam-sessions", ensureDBConnection, examSessionRoutes);
app.use("/api/users", ensureDBConnection, userRoutes);
app.use("/api/analytics", ensureDBConnection, analyticsRoutes);
app.use("/api/events", ensureDBConnection, eventRoutes);
app.use("/api/metrics", ensureDBConnection, metricsRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Error handling middleware - must be last
app.use(errorHandler);

// Start server immediately, connect DBs in background
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
});

// Connect databases in background
(async () => {
  await connectRedis().catch(err => console.warn('Redis failed:', err.message));
  await connectDB().catch(err => console.warn('MongoDB failed:', err.message));
})();
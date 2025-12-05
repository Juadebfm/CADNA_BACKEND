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
import resultRoutes from "./routes/resultRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import { ensureDBConnection } from "./middleware/DatabaseMiddleware.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-requested-with', 'Accept'],
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, x-requested-with, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "CADNA Backend API is running!" });
});

app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok', 
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exam-sessions", examSessionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/results", resultRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Error handling middleware - must be last
app.use(errorHandler);

// Connect to databases first, then start server
(async () => {
  try {
    console.log('🔄 Starting CADNA Backend...');
    
    // Connect Redis (non-blocking)
    connectRedis().catch(err => console.warn('Redis failed:', err.message));
    
    // Connect MongoDB (blocking)
    await connectDB();
    
    // Start server only after DB is ready
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();
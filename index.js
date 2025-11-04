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
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Connect to database and Redis
connectDB();
if (process.env.REDIS_URL) {
  connectRedis();
} else {
  console.log("Redis URL not provided, running without Redis caching");
}

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns a message indicating the API is running
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: CADNA Backend API is running!
 */
app.get("/", (req, res) => {
  res.json({ message: "CADNA Backend API is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exam-sessions", examSessionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Error handling middleware - must be last
app.use(errorHandler);

// Start HTTP server first
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect Redis and MongoDB in background
(async () => {
  await connectRedis();
  await connectDB();
})();

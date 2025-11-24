import { createClient } from "redis";

let client = null;
let isConnected = false;

const createRedisClient = () => {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
  });

  redisClient.on("error", (err) => {
    console.warn("Redis unavailable:", err.message);
    isConnected = false;
  });

  redisClient.on("connect", () => {
    console.log("Redis connected");
    isConnected = true;
  });

  return redisClient;
};

export const connectRedis = async () => {
  try {
    client = createRedisClient();
    await client.connect();
  } catch (error) {
    console.warn(
      "Redis connection failed, continuing without Redis:",
      error.message
    );
    client = null;
    isConnected = false;
  }
};

// Safe Redis operations
const safeRedisOperation = async (operation, fallback = null) => {
  if (!client || !isConnected) {
    return fallback;
  }
  try {
    return await operation(client);
  } catch (error) {
    console.warn("Redis operation failed:", error.message);
    return fallback;
  }
};

const redis = {
  get: (key) => safeRedisOperation((client) => client.get(key)),
  set: (key, value) => safeRedisOperation((client) => client.set(key, value)),
  setEx: (key, seconds, value) =>
    safeRedisOperation((client) => client.setEx(key, seconds, value)),
  del: (key) => safeRedisOperation((client) => client.del(key)),
  exists: (key) => safeRedisOperation((client) => client.exists(key), false),
};

export default redis;

import Redis from "ioredis";

let client;

export const getRedisClient = () => {
  if (!client) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    client = new Redis(url);

    client.on("connect", () => {
      console.log(`✅ Sink connected to Redis: ${url}`);
    });

    client.on("error", (err) => {
      console.error("❌ Redis error in sink:", err.message);
    });
  }
  return client;
};

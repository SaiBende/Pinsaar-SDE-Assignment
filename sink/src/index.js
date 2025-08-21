import express from "express";
import dotenv from "dotenv";
import { getRedisClient } from "../config/redis.js";
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const app = express();
const PORT = process.env.SINK_PORT || 4000;
const redis = getRedisClient();

app.use(express.json());

app.post("/sink", async (req, res) => {
  const noteId = req.headers["x-note-id"];
  const idempotencyKey = req.headers["x-idempotency-key"];

  if (!noteId || !idempotencyKey) {
    return res.status(400).json({ error: "Missing headers" });
  }

  try {
    // Try to set the key, expire after 1 day
    const alreadyProcessed = !(await redis.set(
      `sink:note:${idempotencyKey}`,
      "processed",
      "NX",
      "EX",
      60 * 60 * 24
    ));

    if (alreadyProcessed) {
      console.warn(`⚠️ Duplicate delivery ignored: noteId=${noteId}`);
      return res.status(200).json({ ok: true, duplicate: true });
    }

    console.log("📥 Received note:", {
      noteId,
      title: req.body.title,
      body: req.body.body,
      releaseAt: req.body.releaseAt,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Error handling webhook:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "sink" });
});

app.listen(PORT, () => {
  console.log(`✅ Sink listening on http://localhost:${PORT}`);
});

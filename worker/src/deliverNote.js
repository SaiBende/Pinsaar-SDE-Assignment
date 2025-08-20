import axios from "axios";
import Note from "./model/Note.js";
import { generateIdempotencyKey } from "./utils/idempotency.js";

export const deliverNote = async (note) => {
  const startedAt = new Date();
  const idempotencyKey = generateIdempotencyKey(note._id, note.releaseAt);

  try {
    const response = await axios.post(
      note.webhookUrl,
      {
        id: note._id,
        title: note.title,
        body: note.body,
        releaseAt: note.releaseAt,
      },
      {
        headers: {
          "X-Note-Id": note._id.toString(),
          "X-Idempotency-Key": idempotencyKey,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    // Only 2xx status codes should be considered successful
    if (response.status >= 200 && response.status < 300) {
      note.status = "delivered";
      note.deliveredAt = new Date();
      note.attempts.push({
        at: startedAt,
        statusCode: response.status,
        ok: true,
      });
      await note.save();
      
      // Log structured success info as per assignment
      const successLog = {
        noteId: note._id,
        try: note.attempts.length,
        statusCode: response.status,
        ok: true,
        ms: Date.now() - startedAt.getTime(),
        at: startedAt.toISOString()
      };
      
      console.log(`Delivered note successfully:`, successLog);
    } else {
      // Non-2xx responses should be treated as failures
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    const statusCode = err.response?.status || 0;
    const errorType = err.code || 'HTTP_ERROR';
    
    // Log structured attempt info as per assignment
    const attemptLog = {
      noteId: note._id,
      try: note.attempts.length + 1,
      statusCode,
      ok: false,
      ms: Date.now() - startedAt.getTime(),
      at: startedAt.toISOString(),
      error: err.message
    };
    
    console.warn(`Delivery attempt failed:`, attemptLog);

    note.attempts.push({
      at: startedAt,
      statusCode,
      ok: false,
      error: `${errorType}: ${err.message}`,
    });

    // Mark "failed" → BullMQ will trigger retries
    note.status = "failed";
    await note.save();

    throw err; // important: rethrow so BullMQ retries
  }
};

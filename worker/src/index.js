import dotenv from "dotenv";
import dayjs from "dayjs";
import pkg from "bullmq";
import Note from "./model/Note.js";
import connectDB from "./config/db.js";
import { deliverNote } from "./deliverNote.js";
import path from 'path';


dotenv.config();

const { Queue, Worker } = pkg;

const POLL_INTERVAL = 5000; // 5 seconds

// Redis connection
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
};

// BullMQ queue (used only for dispatching jobs)
const notesQueue = new Queue("notes-queue", { connection });

// Worker → consumes jobs from Redis
const worker = new Worker(
  "notes-queue",
  async (job) => {
    const { noteId } = job.data;
    const note = await Note.findById(noteId);
    if (!note) return;

    const backoffDelays = [0, 1000, 5000, 25000]; // 0 for first attempt
    const currentAttempt = job.attemptsMade || 1;
    
    if (currentAttempt > 1) {
      const delay = backoffDelays[currentAttempt - 1] || 25000;
      console.log(` Waiting ${delay}ms before retry ${currentAttempt} for note ${note._id}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log(`Delivering note ${note._id} (attempt ${currentAttempt}/${job.opts.attempts})`);
    await deliverNote(note);
  },
  {
    connection,
    concurrency: 5,
    attempts: 3, // max retries
  }
);

worker.on("completed", (job) => {
  console.log(` Job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
  console.error(` Job ${job.id} failed: ${err.message}`);
  
  // If this was the final attempt, mark note as "dead"
  if (job.attemptsMade >= 3) {
    const note = await Note.findById(job.data.noteId);
    if (note && note.status === 'failed') {
      note.status = 'dead';
      await note.save();
      console.log(` Note ${note._id} marked as dead after ${job.attemptsMade} attempts`);
    }
  }
});

// Poll Mongo for due notes every POLL_INTERVAL
const pollDueNotes = async () => {
  try {
    const now = dayjs().toDate();
    const notes = await Note.find({
      releaseAt: { $lte: now },
      status: "pending",
    });

    if (notes.length > 0) {
      console.log(` Found ${notes.length} due notes at ${now.toISOString()}`);
    }

    for (const note of notes) {
      // Update status to 'failed' temporarily to prevent double-enqueueing
      const updated = await Note.findOneAndUpdate(
        { _id: note._id, status: 'pending' },
        { status: 'failed' },
        { new: true }
      );
      
      if (updated) {
        // enqueue note into Redis so Worker can deliver
        await notesQueue.add("deliver-note", { noteId: note._id }, {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 1000, // Start with 1s, we'll customize in the worker
          }
        });
        console.log(`📌 Enqueued note ${note._id}`);
      }
    }
  } catch (err) {
    console.error(" Polling error:", err.message);
  }
};

// Start worker process
const start = async () => {
  await connectDB();
  console.log(` Worker started (polling every ${POLL_INTERVAL / 1000}s)`);
  setInterval(pollDueNotes, POLL_INTERVAL);
};

start();

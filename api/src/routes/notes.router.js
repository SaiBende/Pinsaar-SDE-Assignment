import { Router } from "express";
import { z } from "zod";
import { createNote, getNotes, replayNote } from "../service/notes.service.js"

const router = Router();

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  releaseAt: z.string().datetime(),
  webhookUrl: z.string().url(),
});

const listQuerySchema = z.object({
  status: z.enum(["pending", "delivered", "failed", "dead"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

// --- POST /api/notes ---
router.post("/", async (req, res, next) => {
  try {
    const parsed = createNoteSchema.parse(req.body);
    const note = await createNote(parsed);
    res.status(201).json({ id: note._id });
  } catch (err) {
    if (err.errors) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: err.errors });
    }
    next(err);
  }
});

// --- GET /api/notes ---
router.get("/", async (req, res, next) => {
  try {
    const { status, page } = listQuerySchema.parse(req.query);
    const result = await getNotes({ status, page });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// --- POST /api/notes/:id/replay ---
router.post("/:id/replay", async (req, res, next) => {
  try {
    const note = await replayNote(req.params.id);
    res.json({ message: "Note requeued", id: note._id });
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Note not found" });
    }
    if (err.message === "INVALID_STATUS") {
      return res
        .status(400)
        .json({ error: "Only failed or dead notes can be replayed" });
    }
    next(err);
  }
});

export default router;

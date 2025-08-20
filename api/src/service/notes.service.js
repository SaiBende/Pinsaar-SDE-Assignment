import Note from "../model/Note.js"
// Create a new note
export async function createNote(data) {
  const note = await Note.create({
    title: data.title,
    body: data.body,
    releaseAt: new Date(data.releaseAt),
    webhookUrl: data.webhookUrl,
    status: "pending",
  });
  return note;
}

// Get notes with pagination & optional status filter
export async function getNotes({ status, page = 1, pageSize = 20 }) {
  const filter = {};
  if (status) filter.status = status;

  const notes = await Note.find(filter)
    .sort({ createdAt: -1 }) // newest first
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const total = await Note.countDocuments(filter);

  return {
    notes,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Replay note (reset status for worker to pick up again)
export async function replayNote(id) {
  const note = await Note.findById(id);
  if (!note) throw new Error("NOT_FOUND");

  if (note.status !== "failed" && note.status !== "dead") {
    throw new Error("INVALID_STATUS");
  }

  note.status = "pending";
  note.attempts = [];
  note.deliveredAt = null;
  await note.save();

  return note;
}

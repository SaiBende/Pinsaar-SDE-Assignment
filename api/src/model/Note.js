import mongoose from 'mongoose';

const AttemptSchema = new mongoose.Schema(
  {
    at: { type: Date, required: true },          
    statusCode: { type: Number, required: true },
    ok: { type: Boolean, required: true },       
    error: { type: String },                     
  },
  { _id: false },
);

const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    releaseAt: { type: Date, required: true },       // store as Date (ISO string maps to Date)
    webhookUrl: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'dead'],
      default: 'pending',
      index: true, 
    },

    attempts: { type: [AttemptSchema], default: [] },
    deliveredAt: { type: Date, default: null },       
  },
  { timestamps: true },
);

// Index to quickly find notes that are due
NoteSchema.index({ releaseAt: 1 });

// Already added status index via field definition

export default mongoose.model('Note', NoteSchema);

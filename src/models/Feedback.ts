import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  ip: string;
  timestamp: Date;
  url?: string;
  errorMessage?: string;
  feedbackText: string;
}

const FeedbackSchema: Schema = new Schema({
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  url: { type: String },
  errorMessage: { type: String },
  feedbackText: { type: String, required: true }
});

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

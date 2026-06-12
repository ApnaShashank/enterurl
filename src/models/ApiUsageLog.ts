import mongoose, { Schema, Document } from 'mongoose';

export interface IApiUsageLog extends Document {
  ip: string;
  timestamp: Date;
  action: string;
  url?: string;
  platform?: string;
  apiUsed?: string;
  status: string;
  errorMessage?: string;
}

const ApiUsageLogSchema: Schema = new Schema({
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  url: { type: String },
  platform: { type: String },
  apiUsed: { type: String },
  status: { type: String, required: true },
  errorMessage: { type: String }
});

// Avoid Re-compilation of Model in Next.js Hot Reload
export default mongoose.models.ApiUsageLog || mongoose.model<IApiUsageLog>('ApiUsageLog', ApiUsageLogSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IApiConfig extends Document {
  featureName: string;
  requiredLevel: 'free' | 'registered' | 'pro';
  freeLimit: number;
  registeredLimit: number;
  proLimit: number;
}

const ApiConfigSchema: Schema = new Schema({
  featureName: { type: String, required: true, unique: true, index: true },
  requiredLevel: { type: String, enum: ['free', 'registered', 'pro'], default: 'registered' },
  freeLimit: { type: Number, default: 5 },
  registeredLimit: { type: Number, default: 15 },
  proLimit: { type: Number, default: -1 }
});

// Avoid Re-compilation of Model in Next.js Hot Reload
export default mongoose.models.ApiConfig || mongoose.model<IApiConfig>('ApiConfig', ApiConfigSchema);

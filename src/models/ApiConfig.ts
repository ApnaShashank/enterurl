import mongoose, { Schema, Document } from 'mongoose';

export interface IApiConfig extends Document {
  featureName: string;
  requiredLevel: 'free' | 'registered' | 'pro';
}

const ApiConfigSchema: Schema = new Schema({
  featureName: { type: String, required: true, unique: true, index: true },
  requiredLevel: { type: String, enum: ['free', 'registered', 'pro'], default: 'registered' }
});

// Avoid Re-compilation of Model in Next.js Hot Reload
export default mongoose.models.ApiConfig || mongoose.model<IApiConfig>('ApiConfig', ApiConfigSchema);

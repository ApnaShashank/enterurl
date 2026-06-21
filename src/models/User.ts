import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  salt: string;
  role: 'standard' | 'pro' | 'admin';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  role: { type: String, enum: ['standard', 'pro', 'admin'], default: 'standard' },
  createdAt: { type: Date, default: Date.now }
});

// Avoid Re-compilation of Model in Next.js Hot Reload
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

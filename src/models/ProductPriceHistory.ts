import mongoose, { Schema, Document } from 'mongoose';

export interface IPricePoint {
  price: number;
  currency: string;
  timestamp: Date;
}

export interface IProductPriceHistory extends Document {
  url: string;
  domain: string;
  title: string;
  priceHistory: IPricePoint[];
}

const ProductPriceHistorySchema: Schema = new Schema({
  url: { type: String, required: true, unique: true, index: true },
  domain: { type: String, required: true },
  title: { type: String },
  priceHistory: [
    {
      price: { type: Number, required: true },
      currency: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

// Avoid Re-compilation of Model in Next.js Hot Reload
export default mongoose.models.ProductPriceHistory || mongoose.model<IProductPriceHistory>('ProductPriceHistory', ProductPriceHistorySchema);

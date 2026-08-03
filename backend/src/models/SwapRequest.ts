// src/models/SwapRequest.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISwapRequest extends Document {
  requester: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
  requesterName?: string;
  providerName?: string;
  offeredSkill: mongoose.Types.ObjectId;
  requestedSkill: mongoose.Types.ObjectId;
  offeredSkillTitle?: string;
  requestedSkillTitle?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  createdAt: Date;
}

const SwapRequestSchema: Schema<ISwapRequest> = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requesterName: { type: String },
    providerName: { type: String },
    offeredSkill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    requestedSkill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    offeredSkillTitle: { type: String },
    requestedSkillTitle: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const SwapRequest: Model<ISwapRequest> = mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);
export default SwapRequest;

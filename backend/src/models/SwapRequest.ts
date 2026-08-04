// src/models/SwapRequest.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMilestone {
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface ISwapRequest extends Document {
  requester: mongoose.Types.ObjectId;
  provider?: mongoose.Types.ObjectId;
  requesterName?: string;
  providerName?: string;
  offeredSkill: mongoose.Types.ObjectId;
  requestedSkill: mongoose.Types.ObjectId;
  offeredSkillTitle?: string;
  requestedSkillTitle?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  progress?: number;
  progressStatus?: 'In Progress' | 'Practicing' | 'Mastered';
  teacherNotes?: string;
  milestones?: IMilestone[];
  lastUpdatedByTeacher?: Date;
  createdAt: Date;
  isLearnerOnly?: boolean;
}

const SwapRequestSchema: Schema<ISwapRequest> = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User' }, // optional for learner‑only swaps
    requesterName: { type: String },
    providerName: { type: String },
    offeredSkill: { type: Schema.Types.ObjectId, ref: 'Skill' },
    requestedSkill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    offeredSkillTitle: { type: String },
    requestedSkillTitle: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    message: { type: String, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    progressStatus: {
      type: String,
      enum: ['In Progress', 'Practicing', 'Mastered'],
      default: 'In Progress',
    },
    teacherNotes: { type: String, default: '' },
    milestones: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    lastUpdatedByTeacher: { type: Date },
  },
  { timestamps: true },
  // New flag to indicate learner‑only swap
  isLearnerOnly: { type: Boolean, default: false },

);

const SwapRequest: Model<ISwapRequest> = mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);
export default SwapRequest;

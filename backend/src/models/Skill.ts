// src/models/Skill.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISkill extends Document {
  title: string;
  description: string;
  category: 'Technology' | 'Design' | 'Languages' | 'Music' | 'Business' | 'Lifestyle' | 'Other';
  type: 'offered' | 'wanted';
  proficiency: 'Beginner' | 'Intermediate' | 'Expert';
  cost: number;
  mode: 'Online' | 'Offline' | 'Both';
  location?: {
    address?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  user: mongoose.Types.ObjectId;
  userName?: string;
  userEmail?: string;
  tags?: string[];
  createdAt: Date;
}

const SkillSchema: Schema<ISkill> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Technology', 'Design', 'Languages', 'Music', 'Business', 'Lifestyle', 'Other'],
      default: 'Technology',
    },
    type: { type: String, enum: ['offered', 'wanted'], required: true },
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Intermediate' },
    mode: { type: String, enum: ['Online', 'Offline', 'Both'], default: 'Both' },
    location: {
      address: { type: String },
      city: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    userEmail: { type: String },
    tags: [{ type: String }],
    cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Skill: Model<ISkill> = mongoose.model<ISkill>('Skill', SkillSchema);
export default Skill;

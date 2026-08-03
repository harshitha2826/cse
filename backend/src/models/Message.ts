// src/models/Message.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  swapRequestId?: mongoose.Types.ObjectId;
  senderName?: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    swapRequestId: { type: Schema.Types.ObjectId, ref: 'SwapRequest' },
    senderName: { type: String },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;

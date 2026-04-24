import mongoose, { Document, Schema } from 'mongoose';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface IConnection extends Document {
  _id: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId; // ref to User
  recipient: mongoose.Types.ObjectId; // ref to User
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnection>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ConnectionStatus),
      default: ConnectionStatus.PENDING,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate connections between same users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Compound index for efficient queries
connectionSchema.index({ status: 1, updatedAt: -1 });

const Connection = mongoose.models.Connection || mongoose.model<IConnection>('Connection', connectionSchema);

export default Connection;
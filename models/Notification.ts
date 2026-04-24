import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  MESSAGE = 'message',
  CONNECTION_REQUEST = 'connection_request',
  CONNECTION_ACCEPTED = 'connection_accepted',
  JOB_POSTED = 'job_posted',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
  GROUP_ADDED = 'group_added',
  MENTION = 'mention',
}

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  actor?: mongoose.Types.ObjectId;
  entityId?: mongoose.Types.ObjectId;
  entityModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 500 },
    link: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    entityId: { type: Schema.Types.ObjectId },
    entityModel: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);

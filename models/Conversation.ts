import mongoose, { Document, Schema } from 'mongoose';

export enum ConversationType {
  DM = 'dm',
  GROUP = 'group',
}

export enum GroupType {
  BATCH = 'batch',
  DEPARTMENT = 'department',
  CUSTOM = 'custom',
}

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  type: ConversationType;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  unreadCounts: Map<string, number>;
  // Group-only fields
  name?: string;
  description?: string;
  groupAvatar?: string;
  groupType?: GroupType;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  inviteLink?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    type: {
      type: String,
      enum: Object.values(ConversationType),
      default: ConversationType.DM,
      required: true,
    },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastActivity: { type: Date, default: Date.now, required: true },
    unreadCounts: { type: Map, of: Number, default: new Map() },
    // Group fields
    name: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    groupAvatar: { type: String },
    groupType: { type: String, enum: Object.values(GroupType) },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    inviteLink: { type: String, unique: true, sparse: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastActivity: -1 });
conversationSchema.index({ members: 1, lastActivity: -1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ inviteLink: 1 }, { sparse: true });

conversationSchema.pre('save', async function () {
  if (this.type === ConversationType.DM && this.participants.length !== 2) {
    throw new Error('DM conversations must have exactly 2 participants');
  }
});

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', conversationSchema);

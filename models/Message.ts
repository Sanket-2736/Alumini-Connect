import mongoose, { Document, Schema } from 'mongoose';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  SEEN = 'seen'
}

export enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document'
}

export interface IAttachment {
  url: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
}

export interface IReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content?: string;
  attachments: IAttachment[];
  status: MessageStatus;
  reactions: IReaction[];
  replyTo?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>({
  url: { type: String, required: true },
  type: {
    type: String,
    enum: Object.values(AttachmentType),
    required: true
  },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true }
});

const reactionSchema = new Schema<IReaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: { type: String, required: true }
});

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: 2000 // Limit message length
  },
  attachments: [attachmentSchema],
  status: {
    type: String,
    enum: Object.values(MessageStatus),
    default: MessageStatus.SENT,
    required: true
  },
  reactions: [reactionSchema],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 }); // For message history pagination
messageSchema.index({ sender: 1, status: 1 }); // For status updates
messageSchema.index({ conversationId: 1, status: 1 }); // For unread counts

// Pre-save middleware to update conversation unread counts
messageSchema.post('save', async function(doc) {
  try {
    const Conversation = mongoose.model('Conversation');

    // Update unread counts for all participants except sender
    const conversation = await Conversation.findById(doc.conversationId);
    if (conversation) {
      const participants = conversation.participants.map((id: mongoose.Types.ObjectId) => id.toString());
      const senderId = doc.sender.toString();

      // Increment unread count for all participants except sender
      const updateOps: Record<string, number> = {};
      participants.forEach((participantId: string) => {
        if (participantId !== senderId) {
          updateOps[`unreadCounts.${participantId}`] = 1;
        }
      });

      await Conversation.findByIdAndUpdate(doc.conversationId, {
        $inc: updateOps,
        lastActivity: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating conversation unread counts:', error);
  }
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
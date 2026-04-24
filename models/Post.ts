import mongoose, { Document, Schema } from 'mongoose';

export enum PostType {
  POST = 'post',
  ANNOUNCEMENT = 'announcement',
  SUCCESS_STORY = 'success_story',
  EVENT_PROMO = 'event_promo'
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  university?: mongoose.Types.ObjectId;
  content: string;
  images: string[];
  type: PostType;
  likes: mongoose.Types.ObjectId[];
  commentCount: number;
  shareCount: number;
  tags: string[];
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  university: {
    type: Schema.Types.ObjectId,
    ref: 'University'
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  images: [{
    type: String
  }],
  type: {
    type: String,
    enum: Object.values(PostType),
    default: PostType.POST,
    required: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Text index for search on content and tags
postSchema.index({ content: 'text', tags: 'text' });
// Index for sorting
postSchema.index({ isPinned: -1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

export default mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
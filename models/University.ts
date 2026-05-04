import mongoose, { Document, Schema } from 'mongoose';

export interface IUniversity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const universitySchema = new Schema<IUniversity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
universitySchema.index({ isActive: 1 });
universitySchema.index({ name: 1 });

// Pre-save middleware to generate slug if not provided
universitySchema.pre('save', function(this: IUniversity) {
  // Only generate slug if it's not already set
  if (!this.slug && this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

const University = mongoose.models.University || mongoose.model<IUniversity>('University', universitySchema);

export default University;
import mongoose, { Document, Schema } from 'mongoose';

export interface IUniversity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  location: string;
  state?: string;
  yearEstablished?: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  totalStudents?: number;
  totalAlumni?: number;
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
    state: {
      type: String,
      trim: true,
    },
    yearEstablished: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    totalStudents: {
      type: Number,
      min: 0,
    },
    totalAlumni: {
      type: Number,
      min: 0,
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
universitySchema.index({ isActive: 1 });
universitySchema.index({ name: 1 });
universitySchema.index({ state: 1 });
universitySchema.pre('save', function(this: IUniversity) {
  if (!this.slug && this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

const University = mongoose.models.University || mongoose.model<IUniversity>('University', universitySchema);

export default University;
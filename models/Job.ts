import mongoose, { Document, Schema } from 'mongoose';

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract',
  FREELANCE = 'freelance'
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  ANY = 'any'
}

export enum JobStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  EXPIRED = 'expired'
}

export interface ISalary {
  min?: number;
  max?: number;
  currency?: string;
  isDisclosed: boolean;
}

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  university?: mongoose.Types.ObjectId;
  title: string;
  company: string;
  location?: string;
  isRemote: boolean;
  type: JobType;
  experienceLevel: ExperienceLevel;
  description: string;
  requirements: string[];
  applyLink?: string;
  isReferral: boolean;
  referralNote?: string;
  salary: ISalary;
  skills: string[];
  deadline?: Date;
  status: JobStatus;
  applicants: mongoose.Types.ObjectId[];
  viewCount: number;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

const salarySchema = new Schema<ISalary>({
  min: Number,
  max: Number,
  currency: { type: String, default: 'USD' },
  isDisclosed: { type: Boolean, default: false }
});

const jobSchema = new Schema<IJob>({
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  university: {
    type: Schema.Types.ObjectId,
    ref: 'University'
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: String,
  isRemote: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: Object.values(JobType),
    required: true
  },
  experienceLevel: {
    type: String,
    enum: Object.values(ExperienceLevel),
    default: ExperienceLevel.ANY
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  requirements: [String],
  applyLink: String,
  isReferral: {
    type: Boolean,
    default: false
  },
  referralNote: String,
  salary: {
    type: salarySchema,
    default: { isDisclosed: false }
  },
  skills: [String],
  deadline: Date,
  status: {
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.ACTIVE
  },
  applicants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Text index for search
jobSchema.index({ title: 'text', description: 'text', company: 'text', skills: 'text' });
// Index for filtering and sorting
jobSchema.index({ status: 1, expiresAt: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ type: 1, experienceLevel: 1 });

// TTL index to auto-expire jobs
jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set expiresAt
jobSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    this.expiresAt = expiresAt;
  }
  next();
});

export default mongoose.models.Job || mongoose.model<IJob>('Job', jobSchema);
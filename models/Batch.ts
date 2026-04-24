import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  _id: mongoose.Types.ObjectId;
  year: number;
  label: string;
  university: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
    },
    university: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
batchSchema.index({ university: 1, department: 1, year: 1 }, { unique: true });

const Batch = mongoose.models.Batch || mongoose.model<IBatch>('Batch', batchSchema);

export default Batch;
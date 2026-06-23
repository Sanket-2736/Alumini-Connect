import mongoose, { Schema, Document } from 'mongoose';

export enum CallStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

export interface IVideoCallBooking extends Document {
  _id: mongoose.Types.ObjectId;
  alumniId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: CallStatus;
  title: string;
  description?: string;
  sessionId: string;
  recordingUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoCallBookingSchema = new Schema<IVideoCallBooking>(
  {
    alumniId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
    },
    scheduledEndTime: {
      type: Date,
      required: true,
    },
    actualStartTime: Date,
    actualEndTime: Date,
    status: {
      type: String,
      enum: Object.values(CallStatus),
      default: CallStatus.SCHEDULED,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    recordingUrl: String,
    notes: String,
  },
  { timestamps: true }
);

// Index for efficient queries
VideoCallBookingSchema.index({ alumniId: 1, status: 1 });
VideoCallBookingSchema.index({ studentId: 1, status: 1 });
VideoCallBookingSchema.index({ scheduledStartTime: 1 });
VideoCallBookingSchema.index({ sessionId: 1 });

export default mongoose.models.VideoCallBooking ||
  mongoose.model<IVideoCallBooking>('VideoCallBooking', VideoCallBookingSchema);

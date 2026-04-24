import mongoose from 'mongoose';

/**
 * Global cache for MongoDB connection to avoid multiple connections in development
 */
const globalWithMongoose = global as typeof global & {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Connect to MongoDB using Mongoose
 * Uses cached connection in development to prevent connection issues
 */
async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalWithMongoose.mongoose?.conn) {
    return globalWithMongoose.mongoose.conn;
  }

  if (!globalWithMongoose.mongoose?.promise) {
    const opts = {
      bufferCommands: false,
    };

    globalWithMongoose.mongoose = {
      conn: null,
      promise: mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose),
    };
  }

  try {
    globalWithMongoose.mongoose.conn = await globalWithMongoose.mongoose.promise;
  } catch (e) {
    globalWithMongoose.mongoose.promise = null;
    throw e;
  }

  return globalWithMongoose.mongoose.conn!;
}

export default connectToDatabase;
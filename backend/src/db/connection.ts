import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });
  console.log('[DB] Connected to MongoDB');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[DB] Disconnected from MongoDB');
}

// src/config/db.ts
import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore if custom DNS fails
}

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    throw new Error('❌ MONGO_URI environment variable is not set. Please configure it in Railway.');
  }

  console.log('⏳ Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('🗄️  MongoDB Atlas connected successfully!');
};

export default connectDB;

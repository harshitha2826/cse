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

let mongoMemoryServerInstance: any = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  const MONGO_URI = process.env.MONGO_URI || '';

  if (MONGO_URI) {
    try {
      console.log('⏳ Connecting to MongoDB Atlas...');
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('🗄️  MongoDB Atlas connected successfully!');
      return;
    } catch (err: any) {
      console.warn('⚠️ Could not connect to MongoDB Atlas:', err.message);
      console.log('🔄 Falling back to local in-memory MongoDB database...');
      try {
        await mongoose.disconnect();
      } catch (_) {}
    }
  }

  // Fallback to MongoMemoryServer for zero-config local development
  try {
    if (!mongoMemoryServerInstance) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create();
    }
    const memoryUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log('🗄️  Local in-memory MongoDB connected successfully!');
  } catch (memErr: any) {
    console.error('❌ Failed to connect to in-memory database:', memErr.message);
  }
};

export default connectDB;

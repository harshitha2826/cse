// src/server.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db';

import authRouter from './routes/auth';
import skillsRouter from './routes/skills';
import swapsRouter from './routes/swaps';
import messagesRouter from './routes/messages';
import aiRouter from './routes/ai';
import Message from './models/Message';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://cse-frontend-two.vercel.app',
      'https://cse-frontend-isqa3muvk-harshitha2827.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://cse-frontend-two.vercel.app',
      'https://cse-frontend-isqa3muvk-harshitha2827.vercel.app',
    ],
    credentials: true,
  })
);
app.use(express.json());

// Ensure Database is connected for every request
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// Connect to MongoDB on startup
connectDB();

// Root Welcome & Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: '🚀 SkillBridge Backend API Server is running successfully!',
    endpoints: {
      auth: '/api/auth',
      skills: '/api/skills',
      swaps: '/api/swaps',
      messages: '/api/messages',
      ai: '/api/ai',
    },
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB' : 'Connecting to MongoDB...',
  });
});

app.get('/api', (req, res) => {
  res.json({ status: 'online', message: 'SkillBridge API v1' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/swaps', swapsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/ai', aiRouter);

// Socket.io Real-time Chat
io.on('connection', (socket) => {
  console.log('🔌 New client connected to Socket.io:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`👤 Client ${socket.id} joined chat room: ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { sender, receiver, senderName, content, swapRequestId, roomId } = data;
      const newMessage = new Message({
        sender,
        receiver,
        senderName: senderName || 'User',
        swapRequestId,
        content,
      });
      await newMessage.save();

      // Emit to room
      io.to(roomId || receiver).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Socket send_message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

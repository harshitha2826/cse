"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = require("./config/db");
const auth_1 = __importDefault(require("./routes/auth"));
const skills_1 = __importDefault(require("./routes/skills"));
const swaps_1 = __importDefault(require("./routes/swaps"));
const messages_1 = __importDefault(require("./routes/messages"));
const ai_1 = __importDefault(require("./routes/ai"));
const Message_1 = __importDefault(require("./models/Message"));
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
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
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'https://cse-frontend-two.vercel.app',
        'https://cse-frontend-isqa3muvk-harshitha2827.vercel.app',
    ],
    credentials: true,
}));
app.use(express_1.default.json());
// Ensure Database is connected for every request
app.use(async (req, res, next) => {
    if (mongoose_1.default.connection.readyState !== 1) {
        try {
            await (0, db_1.connectDB)();
        }
        catch (err) {
            console.error('DB connection error on request:', err.message);
            return res.status(503).json({ error: 'Database unavailable. Check MONGO_URI in Railway variables.' });
        }
    }
    next();
});
// Connect to MongoDB on startup
(0, db_1.connectDB)().catch((err) => {
    console.error('❌ Startup DB connection failed:', err.message);
    console.error('👉 Set MONGO_URI in Railway: https://railway.app → your service → Variables');
});
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
        database: mongoose_1.default.connection.readyState === 1 ? 'Connected to MongoDB' : 'Connecting to MongoDB...',
    });
});
app.get('/api', (req, res) => {
    res.json({ status: 'online', message: 'SkillBridge API v1' });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/skills', skills_1.default);
app.use('/api/swaps', swaps_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/ai', ai_1.default);
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
            const newMessage = new Message_1.default({
                sender,
                receiver,
                senderName: senderName || 'User',
                swapRequestId,
                content,
            });
            await newMessage.save();
            // Emit to room
            io.to(roomId || receiver).emit('receive_message', newMessage);
        }
        catch (err) {
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
